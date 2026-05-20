import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Upload, FileText, Zap, CheckCircle, ArrowLeft,
  PenLine, Sparkles, ChevronRight, RefreshCw, AlertCircle,
  Plus, Trash2, GripVertical, Eye, Edit3, Download, Wand2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { rewriteResume, enhanceBullet } from '../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by y-position (rounded to a 3px grid) to reconstruct real lines.
    // PDF y-axis increases upward, so we sort descending to get top→bottom order.
    const rows = new Map<number, Array<{ x: number; text: string }>>();
    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const str = (item as any).str as string;
      if (!str.trim()) continue;
      const [, , , , x, y] = (item as any).transform as number[];
      const rowKey = Math.round(y / 3) * 3;
      if (!rows.has(rowKey)) rows.set(rowKey, []);
      rows.get(rowKey)!.push({ x, text: str });
    }

    const lines = Array.from(rows.entries())
      .sort(([ya], [yb]) => yb - ya)                   // top of page first
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)                   // left-to-right within line
          .map((i) => i.text)
          .join(' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      )
      .filter(Boolean);

    if (lines.length) pageTexts.push(lines.join('\n'));
  }

  return pageTexts.join('\n\n');
}

interface WorkEntry {
  id: string;
  title: string;
  company: string;
  period: string;
  bullets: string[];
}

interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  period: string;
  details: string;
}

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string[];
  experience: WorkEntry[];
  education: EducationEntry[];
  certifications: string[];
  relevantCourses: string[];
  projects: string[];
  affiliations: string[];
  leadership: string[];
  clubs: string[];
  volunteer: string[];
  awards: string[];
  languages: string[];
}

function parseResumeText(raw: string): ResumeData {
  const allLines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const data: ResumeData = {
    name: '', email: '', phone: '', location: '', linkedin: '',
    summary: '', skills: [], experience: [], education: [], certifications: [], relevantCourses: [],
    projects: [], affiliations: [], leadership: [], clubs: [], volunteer: [], awards: [], languages: [],
  };

  // ── Contact extraction (scan first 10 lines) ─────────────────────────────
  const contactBlock = allLines.slice(0, 10).join(' ');
  const emailMatch   = contactBlock.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const phoneMatch   = contactBlock.match(/(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}|\+\d[\d\s\-().]{6,18}/);
  const linkedinMatch = contactBlock.match(/linkedin\.com\/in\/[\w%-]+/i);
  if (emailMatch)   data.email   = emailMatch[0];
  if (phoneMatch)   data.phone   = phoneMatch[0].trim();
  if (linkedinMatch) data.linkedin = linkedinMatch[0];

  // Name: first line, stripped of any contact details it might contain
  let nameRaw = allLines[0] || '';
  [emailMatch?.[0], phoneMatch?.[0], linkedinMatch?.[0]]
    .filter(Boolean)
    .forEach((v) => { nameRaw = nameRaw.replace(v!, ''); });
  nameRaw = nameRaw
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[|·•,\-–]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // If line 0 looks like pure contact info, try line 1
  if (!nameRaw || /^[\d+\s().@]/.test(nameRaw)) nameRaw = allLines[1]?.split(/[|·•,]/)[0].trim() || nameRaw;
  data.name = nameRaw;

  // ── Section heading map ───────────────────────────────────────────────────
  // Each entry: [regex tested against normalized line, section key]
  const SECTION_MAP: [RegExp, string][] = [
    [/^(?:professional\s+)?summary$|^objective$|^professional\s+profile$|^career\s+(?:summary|objective|profile)$/i, 'summary'],
    [/^(?:work\s+)?experience$|^work\s+history$|^employment(?:\s+history)?$|^professional\s+experience$/i, 'experience'],
    [/^education(?:\s+background)?$|^academic\s+(?:background|history)$|^qualifications?$/i, 'education'],
    [/^(?:technical\s+)?skills?(?:\s+[&\/]\s*expertise)?$|^(?:core\s+)?competencies$|^expertise$|^areas?\s+of\s+expertise$/i, 'skills'],
    [/^certifications?(?:\s+[&\/]\s*licen[sc]es?)?$|^licen[sc]es?(?:\s+[&\/]\s*certifications?)?$|^professional\s+certifications?$/i, 'certifications'],
    [/^relevant\s+courses?$|^coursework$|^related\s+courses?$/i, 'relevantCourses'],
    [/^projects?(?:\s+[&\/]\s*portfolio)?$|^portfolio$|^personal\s+projects?$/i, 'projects'],
    [/^professional\s+affiliations?$|^memberships?$|^associations?$/i, 'affiliations'],
    [/^leadership(?:\s+[&\/]\s*(?:management|experience))?$|^management\s+experience$/i, 'leadership'],
    [/^clubs?(?:\s*[\/&]\s*affiliations?)?$|^extracurricular(?:\s+activities)?$/i, 'clubs'],
    [/^volunteer(?:ing|s?\s+work|\s+experience)?$|^community\s+service$/i, 'volunteer'],
    [/^awards?(?:\s+[&\/]\s*honors?)?$|^honors?(?:\s+[&\/]\s*awards?)?$|^recognitions?$|^achievements?$/i, 'awards'],
    [/^languages?(?:\s+(?:skills?|proficiency))?$/i, 'languages'],
  ];

  const detectSection = (line: string): string | null => {
    if (line.length > 65) return null;
    const trimmed = line.trim().replace(/:$/, ''); // strip trailing colon
    for (const [pat, key] of SECTION_MAP) {
      if (pat.test(trimmed)) return key;
    }
    // Also match ALL-CAPS headings (e.g. "WORK EXPERIENCE", "EDUCATION")
    if (/^[A-Z][A-Z\s&\/]{1,40}$/.test(trimmed)) {
      const lower = trimmed.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      for (const [pat, key] of SECTION_MAP) {
        if (pat.test(lower)) return key;
      }
    }
    return null;
  };

  let currentSection = '';
  const sectionContent: Record<string, string[]> = {};

  for (const line of allLines) {
    const detected = detectSection(line);
    if (detected) {
      currentSection = detected;
      if (!sectionContent[currentSection]) sectionContent[currentSection] = [];
    } else if (currentSection) {
      sectionContent[currentSection].push(line);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (sectionContent['summary']) {
    data.summary = sectionContent['summary'].slice(0, 8).join(' ').replace(/\s{2,}/g, ' ').trim();
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  if (sectionContent['skills']) {
    // Handle both comma/pipe delimited single lines and one-skill-per-line formats
    const rawSkills = sectionContent['skills'];
    const isSingleLinePerSkill = rawSkills.every((l) => l.split(/[,|]/).length === 1);
    let skills: string[];
    if (isSingleLinePerSkill) {
      // Each line is a skill or a "Category: skill1, skill2" row
      skills = rawSkills.flatMap((l) => {
        const withoutLabel = l.replace(/^[\w\s]+:\s*/, ''); // strip "Category: "
        return withoutLabel.split(/[,|•·]/).map((s) => s.trim()).filter((s) => s.length > 1);
      });
    } else {
      skills = rawSkills.join('\n').split(/[,|•·\n]/).map((s) => s.trim()).filter((s) => s.length > 1);
    }
    // Remove lines that are just category headings (end with colon)
    skills = skills.filter((s) => !/^\w[\w\s]*:$/.test(s) && s.length < 50);
    data.skills = Array.from(new Set(skills)).slice(0, 30);
  }

  // ── Experience ────────────────────────────────────────────────────────────
  if (sectionContent['experience']) {
    const expLines = sectionContent['experience'];
    let current: WorkEntry | null = null;

    const MONTHS = /jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?/i;
    const containsDate = (l: string) => /\d{4}/.test(l) || MONTHS.test(l) || /present|current/i.test(l);
    const isDateRange   = (l: string) => /(\d{4}|present).*?[–\-—].*?(\d{4}|present)/i.test(l) || new RegExp(`(${MONTHS.source}[,\\s]+\\d{4})\\s*[–\\-—]\\s*(${MONTHS.source}[,\\s]+\\d{4}|present)`, 'i').test(l);
    const isBullet      = (l: string) => /^[•\-*–▪▸→]/.test(l);

    const pushCurrent = () => { if (current) { data.experience.push(current); current = null; } };

    for (const line of expLines) {
      // Pattern: "Title | Company | Jan 2022 – Present"  or  "Title at Company, Jan 2022"
      const pipeMatch = line.match(/^(.+?)\s*[|·]\s*(.+?)\s*[|·]\s*(.+)$/);
      const atMatch   = line.match(/^(.+?)\s+(?:at|@)\s+(.+?)\s*[,—–]\s*(\d.+|present.*)$/i);

      if (pipeMatch && containsDate(pipeMatch[3])) {
        pushCurrent();
        current = { id: Math.random().toString(36).slice(2), title: pipeMatch[1].trim(), company: pipeMatch[2].trim(), period: pipeMatch[3].trim(), bullets: [] };
        continue;
      }
      if (atMatch && containsDate(atMatch[3])) {
        pushCurrent();
        current = { id: Math.random().toString(36).slice(2), title: atMatch[1].trim(), company: atMatch[2].trim(), period: atMatch[3].trim(), bullets: [] };
        continue;
      }

      if (isBullet(line)) {
        if (current) current.bullets.push(line.replace(/^[•\-*–▪▸→]\s*/, ''));
        continue;
      }

      if (isDateRange(line) || (containsDate(line) && line.length < 70)) {
        if (current && !current.period) { current.period = line; continue; }
      }

      // Plain text line: title, then company, then new entry
      if (line.length > 2 && line.length < 90) {
        if (!current) {
          current = { id: Math.random().toString(36).slice(2), title: line, company: '', period: '', bullets: [] };
        } else if (!current.company && !current.period && current.bullets.length === 0) {
          current.company = line;
        } else {
          pushCurrent();
          current = { id: Math.random().toString(36).slice(2), title: line, company: '', period: '', bullets: [] };
        }
      }
    }
    pushCurrent();
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (sectionContent['education']) {
    const eduLines = sectionContent['education'];
    let current: EducationEntry | null = null;

    const hasDate     = (l: string) => /\d{4}|expected|present/i.test(l);
    const isBulletL   = (l: string) => /^[•\-*–]/.test(l);
    const isInstitution = (l: string) =>
      /university|college|institute|school|academy|polytechnic|community\s+college/i.test(l);
    const isDegree = (l: string) =>
      /bachelor|master|associate|doctor|ph\.?d|b\.?s\.?c?|m\.?s\.?c?|b\.?a\.?|m\.?b\.?a\.?|m\.?d\.?|diploma|certificate|degree|honours|honors/i.test(l);

    for (const line of eduLines) {
      if (isBulletL(line)) {
        if (current) current.details += (current.details ? ' | ' : '') + line.replace(/^[•\-*–]\s*/, '');
        continue;
      }
      if (hasDate(line) && line.length < 70) {
        if (current && !current.period) { current.period = line; continue; }
      }
      if (isInstitution(line)) {
        if (current && !current.institution) { current.institution = line; continue; }
        if (current) data.education.push(current);
        current = { id: Math.random().toString(36).slice(2), degree: '', institution: line, period: '', details: '' };
        continue;
      }
      if (isDegree(line)) {
        if (current && !current.degree) { current.degree = line; continue; }
        if (current) data.education.push(current);
        current = { id: Math.random().toString(36).slice(2), degree: line, institution: '', period: '', details: '' };
        continue;
      }
      // Generic line
      if (!current) {
        current = { id: Math.random().toString(36).slice(2), degree: '', institution: line, period: '', details: '' };
      } else if (!current.institution) {
        current.institution = line;
      } else if (!current.degree) {
        current.degree = line;
      } else {
        current.details += (current.details ? ' | ' : '') + line;
      }
    }
    if (current) data.education.push(current);
  }

  // ── Simple list sections (strip leading bullet chars) ────────────────────
  const simpleList = (key: string, limit = 15) =>
    (sectionContent[key] || [])
      .map((l) => l.replace(/^[•\-*–▪]\s*/, '').trim())
      .filter((l) => l.length > 2)
      .slice(0, limit);

  data.certifications  = simpleList('certifications', 15);
  data.projects        = simpleList('projects', 20);
  data.affiliations    = simpleList('affiliations', 10);
  data.leadership      = simpleList('leadership', 10);
  data.clubs           = simpleList('clubs', 10);
  data.volunteer       = simpleList('volunteer', 10);
  data.awards          = simpleList('awards', 10);

  // ── Relevant Courses ──────────────────────────────────────────────────────
  if (sectionContent['relevantCourses']) {
    data.relevantCourses = sectionContent['relevantCourses']
      .join(' ').split(/[,;|•·\n]/).map((c) => c.trim()).filter((c) => c.length > 2);
  }

  // ── Languages ─────────────────────────────────────────────────────────────
  if (sectionContent['languages']) {
    data.languages = sectionContent['languages']
      .join('\n').split(/[,;|•·\n]/).map((l) => l.trim()).filter((l) => l.length > 1 && l.length < 60);
  }

  return data;
}

function resumeDataToText(d: ResumeData): string {
  const lines: string[] = [];
  if (d.name) lines.push(d.name);
  const contact = [d.email, d.phone, d.location, d.linkedin].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);
  lines.push('');
  if (d.summary) { lines.push('SUMMARY'); lines.push(d.summary); lines.push(''); }
  if (d.skills.length) { lines.push('SKILLS'); lines.push(d.skills.join(' | ')); lines.push(''); }
  if (d.experience.length) {
    lines.push('EXPERIENCE');
    for (const e of d.experience) {
      lines.push(e.title + (e.company ? ` — ${e.company}` : ''));
      if (e.period) lines.push(e.period);
      for (const b of e.bullets) lines.push(`• ${b}`);
      lines.push('');
    }
  }
  if (d.education.length) {
    lines.push('EDUCATION');
    for (const e of d.education) {
      lines.push(e.degree);
      if (e.institution) lines.push(e.institution);
      if (e.period) lines.push(e.period);
      if (e.details) lines.push(e.details);
      lines.push('');
    }
  }
  if (d.certifications.length) {
    lines.push('CERTIFICATIONS');
    for (const c of d.certifications) lines.push(`• ${c}`);
    lines.push('');
  }
  if (d.relevantCourses.length) {
    lines.push('RELEVANT COURSES');
    lines.push(d.relevantCourses.join(', '));
    lines.push('');
  }
  if (d.projects.length) {
    lines.push('PROJECTS');
    for (const p of d.projects) lines.push(`• ${p}`);
    lines.push('');
  }
  if (d.affiliations.length) {
    lines.push('PROFESSIONAL AFFILIATIONS');
    for (const a of d.affiliations) lines.push(`• ${a}`);
    lines.push('');
  }
  if (d.leadership.length) {
    lines.push('LEADERSHIP & MANAGEMENT');
    for (const l of d.leadership) lines.push(`• ${l}`);
    lines.push('');
  }
  if (d.clubs.length) {
    lines.push('CLUBS/AFFILIATIONS');
    for (const c of d.clubs) lines.push(`• ${c}`);
    lines.push('');
  }
  if (d.volunteer.length) {
    lines.push('VOLUNTEER WORK');
    for (const v of d.volunteer) lines.push(`• ${v}`);
    lines.push('');
  }
  if (d.awards.length) {
    lines.push('AWARDS & HONORS');
    for (const a of d.awards) lines.push(`• ${a}`);
    lines.push('');
  }
  if (d.languages.length) {
    lines.push('LANGUAGES');
    lines.push(d.languages.join(' | '));
    lines.push('');
  }
  return lines.join('\n');
}

type Step = 'choice' | 'uploading' | 'organizing' | 'editing' | 'regenerating' | 'preview';
type EditorTab = 'contact' | 'education' | 'skills' | 'relevantCourses' | 'experience' | 'projects' | 'certifications' | 'affiliations' | 'leadership' | 'clubs' | 'volunteer' | 'awards' | 'languages';

export default function GetStarted() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('choice');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [rewrittenResume, setRewrittenResume] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [rewriteError, setRewriteError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('contact');
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const [enhancingBullet, setEnhancingBullet] = useState<string | null>(null);
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === 'application/pdf') processFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFile = async (file: File) => {
    setResumeFile(file);
    setExtractError('');
    setIsExtracting(true);
    setStep('uploading');
    try {
      const text = await extractPdfText(file);
      if (!text || text.length < 50) throw new Error('Could not read text from this PDF. It may be a scanned image — try copying the text manually.');
      // Use AI to organize raw extracted text into properly structured sections
      setStep('organizing');
      const result = await rewriteResume(text);
      const organized = result.rewrittenResume || text;
      const parsed = parseResumeText(organized);
      setResumeData(parsed);
      setStep('editing');
    } catch (err: any) {
      setExtractError(err.message || 'Failed to read the PDF. Please try again.');
      setStep('choice');
      setResumeFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === 'application/pdf') processFile(file);
    else setExtractError('Please upload a PDF file.');
    e.target.value = '';
  };

  useEffect(() => {
    if (highlightSection && previewRefs.current[highlightSection]) {
      previewRefs.current[highlightSection]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightSection]);

  // Only scroll + highlight — used when switching tabs
  const scrollAndHighlight = (section: string) => {
    setHighlightSection(section);
    setTimeout(() => setHighlightSection(null), 1800);
  };

  // Only highlight (no scroll) — used on every keystroke to avoid page jumping
  const highlight = (section: string) => {
    setHighlightSection(section);
    setTimeout(() => setHighlightSection(null), 1200);
  };

  const handleRegenerate = async () => {
    if (!resumeData) return;
    setRewriteError('');
    setStep('regenerating');
    try {
      const rawText = resumeDataToText(resumeData);
      const result = await rewriteResume(rawText);
      setRewrittenResume(result.rewrittenResume);
      setStep('preview');
    } catch (err: any) {
      setRewriteError(err.message || 'Failed to regenerate resume. Please try again.');
      setStep('editing');
    }
  };

  const goToApp = (text: string) => {
    navigate('/app', { state: { resumeText: text, resumeFileName: resumeFile?.name ?? '', fromGetStarted: true } });
  };

  const skipToApp = () => navigate('/app');

  const downloadResumePDF = (text: string, filename = 'resume.pdf') => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginL = 15, marginR = 15, marginT = 16, marginB = 16;
    const contentWidth = pageWidth - marginL - marginR;
    let y = marginT;

    const sectionHeaders = [
      'EDUCATION', 'SKILLS', 'TECHNICAL SKILLS', 'EXPERIENCE', 'WORK EXPERIENCE',
      'PROFESSIONAL EXPERIENCE', 'PROJECTS', 'CERTIFICATIONS', 'SUMMARY', 'OBJECTIVE',
      'PROFESSIONAL AFFILIATIONS', 'LEADERSHIP', 'LEADERSHIP & MANAGEMENT',
      'CLUBS/AFFILIATIONS', 'RELEVANT COURSES', 'AWARDS', 'VOLUNTEER',
    ];
    const isSectionHeader = (line: string) =>
      sectionHeaders.some((h) => line.trim().toUpperCase() === h || line.trim().toUpperCase().startsWith(h + ' '));
    const isBullet = (line: string) => /^[•\-\*›»·▪]/.test(line.trim());

    const addPage = () => { doc.addPage(); y = marginT; };
    const ensureSpace = (needed: number) => { if (y + needed > pageHeight - marginB) addPage(); };

    const lines = text.split('\n');
    let isFirstLine = true;

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (!line.trim()) {
        y += 2.5;
        continue;
      }

      if (isFirstLine) {
        // Name — large bold centred
        ensureSpace(10);
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.text(line.trim(), pageWidth / 2, y, { align: 'center' });
        y += 8;
        isFirstLine = false;
        continue;
      }

      if (isSectionHeader(line)) {
        ensureSpace(10);
        y += 2;
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text(line.trim().toUpperCase(), marginL, y);
        y += 1.5;
        doc.setLineWidth(0.4);
        doc.line(marginL, y, pageWidth - marginR, y);
        y += 4.5;
        continue;
      }

      if (isBullet(line)) {
        const bulletText = line.trim().replace(/^[•\-\*›»·▪]\s*/, '');
        const indent = marginL + 5;
        const bulletWidth = contentWidth - 5;
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        const wrapped = doc.splitTextToSize(bulletText, bulletWidth);
        ensureSpace(wrapped.length * 4.5);
        doc.text('•', marginL + 1, y);
        doc.text(wrapped, indent, y);
        y += wrapped.length * 4.5 + 0.5;
        continue;
      }

      // Contact line (second line — smaller grey)
      if (line.includes('@') || line.includes('|') || line.match(/\d{3}.*\d{4}/)) {
        ensureSpace(6);
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(80, 80, 80);
        doc.text(line.trim(), pageWidth / 2, y, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        y += 5.5;
        continue;
      }

      // Check if bold (role/company title heuristic: not too long, no bullet)
      const isBoldLine = line.length < 80 && !line.startsWith(' ');
      doc.setFont('times', isBoldLine ? 'bold' : 'normal');
      doc.setFontSize(10.5);
      const wrapped = doc.splitTextToSize(line.trim(), contentWidth);
      ensureSpace(wrapped.length * 4.8);
      doc.text(wrapped, marginL, y);
      y += wrapped.length * 4.8 + 0.3;
    }

    doc.save(filename);
  };

  // ── STEP: choice / uploading ────────────────────────────────────────────────
  if (step === 'choice' || step === 'uploading') {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px]" />
        </div>

        <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors z-10">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="relative z-10 w-full max-w-2xl space-y-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-zinc-800/70 border border-zinc-700/60 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur">
              <Sparkles className="w-3.5 h-3.5" /> CareerDev AI
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
              Before we begin
            </h1>
            <p className="text-zinc-400 text-base max-w-md mx-auto leading-relaxed">
              Is your resume current? A stronger resume means better job matches and higher ATS scores.
            </p>
          </div>

          {extractError && (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {extractError}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="group relative bg-zinc-900/80 backdrop-blur rounded-2xl border border-zinc-800 hover:border-indigo-500/70 shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-7 flex flex-col gap-5 h-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Yes, update it first</h2>
                  <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                    Upload your PDF, add new experience or skills in our two-panel editor, then let AI reorganize everything.
                  </p>
                </div>
                <ul className="space-y-2 flex-1">
                  {['Upload current PDF → instant text extraction', 'Add jobs, skills, certifications', 'Live preview updates as you type', 'AI re-orders chronologically'].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-xs text-zinc-500">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" /> {t}
                    </li>
                  ))}
                </ul>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="gs-resume-upload" disabled={isExtracting} />
                <label
                  htmlFor="gs-resume-upload"
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  className={`mt-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all select-none ${
                    isDragging ? 'bg-indigo-900/50 border-2 border-dashed border-indigo-400 text-indigo-300'
                    : isExtracting ? 'bg-indigo-700/50 text-indigo-200 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'
                  }`}
                >
                  {isExtracting ? <><span className="w-4 h-4 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" /> Reading…</> : <><Upload className="w-4 h-4" /> Upload Resume to Update</>}
                </label>
              </div>
            </div>

            <div className="group relative bg-zinc-900/80 backdrop-blur rounded-2xl border border-zinc-800 hover:border-emerald-500/70 shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-7 flex flex-col gap-5 h-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">No, it's ready</h2>
                  <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                    Jump straight to job matching. Upload your resume and paste a job description for instant analysis.
                  </p>
                </div>
                <ul className="space-y-2 flex-1">
                  {['Upload resume in the app', 'Paste job description', 'Get instant ATS score', 'Optimize for any role'].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-xs text-zinc-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> {t}
                    </li>
                  ))}
                </ul>
                <button onClick={skipToApp} className="mt-auto flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-900/50 transition-colors">
                  <ArrowRight className="w-4 h-4" /> Go to Job Matching
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-600">You can always upload or update your resume inside the app.</p>
        </div>
      </div>
    );
  }

  // ── STEP: organizing — AI formats extracted text ──────────────────────────
  if (step === 'organizing') {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex flex-col items-center justify-center gap-6 p-4">
        <img
          src="/Logo3.png"
          alt="CareerDev AI"
          className="w-20 h-20 object-contain rounded-full animate-spin"
          style={{ animationDuration: '2s', animationTimingFunction: 'linear' }}
        />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">AI is organizing your resume…</h2>
          <p className="text-sm text-zinc-400 max-w-sm">Extracting sections, formatting experience, and structuring your content. This takes about 15–30 seconds.</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span key={delay} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
        <p className="text-xs text-zinc-600">Powered by AI · {resumeFile?.name}</p>
      </div>
    );
  }

  // ── STEP: editing — two-panel layout ───────────────────────────────────────
  if (step === 'editing' && resumeData) {
    const d = resumeData;

    const TAB_ORDER: EditorTab[] = [
      'contact', 'education', 'skills',
      ...(d.relevantCourses && d.relevantCourses.length > 0 ? ['relevantCourses' as EditorTab] : []),
      'experience', 'projects', 'certifications',
      'affiliations', 'leadership', 'clubs', 'volunteer', 'awards', 'languages',
    ];
    const currentTabIdx = TAB_ORDER.indexOf(activeTab);
    const isLastTab = currentTabIdx === TAB_ORDER.length - 1;
    const nextTabId = !isLastTab ? TAB_ORDER[currentTabIdx + 1] : null;

    const handleSaveAndContinue = () => {
      if (nextTabId) {
        setActiveTab(nextTabId);
        scrollAndHighlight(nextTabId);
      } else {
        goToApp(resumeDataToText(d));
      }
    };

    return (
      <div className="h-screen bg-[#0f0f13] flex flex-col overflow-hidden">
        {/* top bar */}
        <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setStep('choice')} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-px h-4 bg-zinc-700 flex-shrink-0" />
            <div className="flex items-center gap-2 text-sm text-zinc-400 truncate">
              <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="truncate hidden sm:inline">{resumeFile?.name}</span>
            </div>
          </div>
        </div>

        {rewriteError && (
          <div className="mx-4 mt-3 flex items-start gap-3 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {rewriteError}
          </div>
        )}

        {/* two-panel body */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* LEFT: Resume Preview */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center py-8 px-4 border-r border-zinc-800" style={{ background: '#1c1c24' }}>
            <div className="w-full max-w-[660px] flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                <Eye className="w-3.5 h-3.5" /> Live Preview
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Updates in real-time
              </div>
            </div>

            {/* Resume — dark section cards (no white paper) */}
            <div className="w-full max-w-[660px] space-y-3 pb-8">

              {/* Contact / Name */}
              <div
                ref={(el) => { previewRefs.current['contact'] = el; }}
                className="rounded-2xl p-5 transition-all duration-500 border"
                style={{
                  background: highlightSection === 'contact'
                    ? 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)'
                    : 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                  borderColor: highlightSection === 'contact' ? '#6366f1' : '#3f3f46',
                }}
              >
                <h1 className="text-[22px] font-bold text-white leading-tight tracking-wide">
                  {d.name || <span className="text-zinc-600 italic text-lg font-normal">Your Name</span>}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
                  {d.email && <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />{d.email}</span>}
                  {d.phone && <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />{d.phone}</span>}
                  {d.location && <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />{d.location}</span>}
                  {d.linkedin && <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />{d.linkedin}</span>}
                </div>
              </div>

              {/* Summary */}
              {d.summary && (
                <div
                  ref={(el) => { previewRefs.current['summary'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'summary' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Summary</DarkSectionLabel>
                  <p className="text-sm text-zinc-300 leading-relaxed mt-2">{d.summary}</p>
                </div>
              )}

              {/* Education */}
              {d.education.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['education'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'education' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Education</DarkSectionLabel>
                  <div className="mt-3 space-y-3">
                    {d.education.map((edu) => (
                      <div key={edu.id} className="pl-3 border-l-2 border-indigo-900">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white text-[13px] leading-snug">
                              {edu.degree || edu.institution}
                            </p>
                            {edu.degree && edu.institution && (
                              <p className="text-[12px] text-indigo-400 mt-0.5">{edu.institution}</p>
                            )}
                          </div>
                          {edu.period && (
                            <span className="text-[11px] text-zinc-500 whitespace-nowrap flex-shrink-0 px-2 py-0.5 rounded bg-zinc-800 ml-2">{edu.period}</span>
                          )}
                        </div>
                        {edu.details && (
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{edu.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {d.skills.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['skills'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'skills' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Skills</DarkSectionLabel>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {d.skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-lg font-medium text-indigo-300"
                        style={{ background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
                      >{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant Courses */}
              {d.relevantCourses.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['relevantCourses'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'relevantCourses' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Relevant Courses</DarkSectionLabel>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {d.relevantCourses.map((c, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {d.experience.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['experience'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'experience' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Experience</DarkSectionLabel>
                  <div className="mt-3 space-y-4">
                    {d.experience.map((exp) => (
                      <div key={exp.id} className="pl-3 border-l-2 border-indigo-900">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="text-[13px] text-indigo-300 italic">
                            {exp.title || <span className="text-zinc-600">Company / Department</span>}
                          </p>
                          {(exp.company || exp.period) && (
                            <p className="text-[12px] text-zinc-400 italic whitespace-nowrap">
                              {[exp.company, exp.period].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                        {exp.bullets.filter(b => b.trim()).length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {exp.bullets.filter(b => b.trim()).map((b, bi) => (
                              <li key={bi} className="flex gap-2 text-[12px] text-zinc-400">
                                <span className="text-indigo-500 flex-shrink-0 font-bold mt-0.5">›</span> {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {d.projects.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['projects'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'projects' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Projects</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.projects.map((p, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">›</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Professional Affiliations */}
              {d.affiliations.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['affiliations'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'affiliations' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Professional Affiliations</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.affiliations.map((a, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">›</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Leadership & Management */}
              {d.leadership.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['leadership'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'leadership' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Leadership &amp; Management</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.leadership.map((l, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">›</span> {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clubs / Affiliations */}
              {d.clubs.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['clubs'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'clubs' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Clubs / Affiliations</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.clubs.map((c, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">›</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Certifications */}
              {d.certifications.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['certifications'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'certifications' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Certifications</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.certifications.map((c, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">›</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Volunteer Work */}
              {d.volunteer.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['volunteer'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'volunteer' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Volunteer Work</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.volunteer.map((v, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">›</span> {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Awards & Honors */}
              {d.awards.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['awards'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'awards' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Awards &amp; Honors</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.awards.map((a, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">›</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Languages */}
              {d.languages.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['languages'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'languages' ? '#6366f1' : '#3f3f46' }}
                >
                  <DarkSectionLabel>Languages</DarkSectionLabel>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {d.languages.map((l, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 bg-zinc-800 border border-zinc-700/60 text-zinc-300 rounded-md">{l}</span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Reorganize button — below live preview */}
            <div className="w-full max-w-[660px] pt-2 pb-8 flex justify-center">
              <button
                onClick={handleRegenerate}
                className="flex items-center justify-center gap-2.5 px-8 py-3 bg-violet-700 hover:bg-violet-600 active:bg-violet-800 text-white rounded-2xl font-bold text-sm transition-colors shadow-lg shadow-violet-900/40"
              >
                <RefreshCw className="w-4 h-4" /> Reorganize &amp; Reformat
              </button>
            </div>
          </div>

          {/* RIGHT: Structured Input Panel */}
          <div className="w-[460px] flex-shrink-0 flex flex-col bg-zinc-950 overflow-hidden">
            <div className="flex flex-wrap gap-px border-b border-zinc-800 bg-zinc-900/60 px-2 pt-2">
              {([
                { id: 'contact', label: 'Contact' },
                { id: 'education', label: 'Education' },
                { id: 'skills', label: 'Skills' },
                ...(d.relevantCourses.length > 0 ? [{ id: 'relevantCourses', label: 'Courses' }] : []),
                { id: 'experience', label: 'Experience' },
                { id: 'projects', label: 'Projects' },
                { id: 'certifications', label: 'Certifications' },
                { id: 'affiliations', label: 'Affiliations' },
                { id: 'leadership', label: 'Leadership' },
                { id: 'clubs', label: 'Clubs' },
                { id: 'volunteer', label: 'Volunteer' },
                { id: 'awards', label: 'Awards' },
                { id: 'languages', label: 'Languages' },
              ] as { id: EditorTab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); scrollAndHighlight(tab.id); }}
                  className={`px-3 py-1.5 mb-2 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-300 bg-indigo-500/25'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Experience Tab */}
              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500 leading-relaxed">Add or edit work experiences. Changes appear instantly in the preview.</p>
                    <button
                      onClick={() => {
                        const newExp: WorkEntry = { id: Math.random().toString(36).slice(2), title: '', company: '', period: '', bullets: [''] };
                        setResumeData({ ...d, experience: [newExp, ...d.experience] });
                        scrollAndHighlight('experience');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {d.experience.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                      <p className="text-zinc-600 text-sm">No experience entries yet.</p>
                      <p className="text-zinc-700 text-xs mt-1">Click "Add" to create one.</p>
                    </div>
                  )}

                  {d.experience.map((exp, idx) => (
                    <div key={exp.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 space-y-3 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-600">
                          <GripVertical className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold text-zinc-500">POSITION {idx + 1}</span>
                        </div>
                        <button
                          onClick={() => { setResumeData({ ...d, experience: d.experience.filter((e) => e.id !== exp.id) }); scrollAndHighlight('experience'); }}
                          className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <InputField label="Job Title" value={exp.title} placeholder="e.g. Senior Software Engineer"
                        onChange={(v) => { updateExp(d, setResumeData, exp.id, 'title', v); highlight('experience'); }} />
                      <InputField label="Company" value={exp.company} placeholder="e.g. Acme Corp"
                        onChange={(v) => { updateExp(d, setResumeData, exp.id, 'company', v); highlight('experience'); }} />
                      <InputField label="Period" value={exp.period} placeholder="e.g. Jan 2022 – Present"
                        onChange={(v) => { updateExp(d, setResumeData, exp.id, 'period', v); highlight('experience'); }} />
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bullet Points</label>
                          <button
                            onClick={() => { updateExp(d, setResumeData, exp.id, 'bullets', [...exp.bullets, '']); highlight('experience'); }}
                            className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add bullet
                          </button>
                        </div>
                        {exp.bullets.map((b, bi) => (
                          <div key={bi} className="flex gap-2 items-start">
                            <span className="text-zinc-600 mt-2.5 flex-shrink-0 text-xs">•</span>
                            <textarea
                              value={b}
                              rows={2}
                              onChange={(e) => {
                                const updated = [...exp.bullets];
                                updated[bi] = e.target.value;
                                updateExp(d, setResumeData, exp.id, 'bullets', updated);
                                highlight('experience');
                              }}
                              placeholder="Describe an achievement or responsibility..."
                              className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/70 resize-none leading-relaxed"
                            />
                            <div className="flex flex-col gap-1 flex-shrink-0 mt-1">
                              <button
                                title="AI enhance this bullet"
                                disabled={enhancingBullet === `${exp.id}:${bi}`}
                                onClick={async () => {
                                  if (!b.trim()) return;
                                  const key = `${exp.id}:${bi}`;
                                  setEnhancingBullet(key);
                                  try {
                                    const res = await enhanceBullet(b, exp.title, exp.company);
                                    if (res.success && res.enhanced) {
                                      const updated = [...exp.bullets];
                                      updated[bi] = res.enhanced;
                                      updateExp(d, setResumeData, exp.id, 'bullets', updated);
                                      highlight('experience');
                                    }
                                  } finally {
                                    setEnhancingBullet(null);
                                  }
                                }}
                                className="text-indigo-500/70 hover:text-indigo-400 disabled:opacity-40 disabled:cursor-wait transition-colors"
                              >
                                {enhancingBullet === `${exp.id}:${bi}`
                                  ? <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin block" />
                                  : <Wand2 className="w-3.5 h-3.5" />}
                              </button>
                              {exp.bullets.length > 1 && (
                                <button
                                  onClick={() => { updateExp(d, setResumeData, exp.id, 'bullets', exp.bullets.filter((_, i) => i !== bi)); }}
                                  className="text-zinc-700 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Education Tab */}
              {activeTab === 'education' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500">Add degrees, diplomas, or courses.</p>
                    <button
                      onClick={() => {
                        const newEdu: EducationEntry = { id: Math.random().toString(36).slice(2), degree: '', institution: '', period: '', details: '' };
                        setResumeData({ ...d, education: [newEdu, ...d.education] });
                        scrollAndHighlight('education');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  {d.education.map((edu, idx) => (
                    <div key={edu.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 space-y-3 group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500">ENTRY {idx + 1}</span>
                        <button onClick={() => { setResumeData({ ...d, education: d.education.filter((e) => e.id !== edu.id) }); }} className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <InputField label="Degree / Qualification" value={edu.degree} placeholder="e.g. B.Sc. Computer Science"
                        onChange={(v) => { updateEdu(d, setResumeData, edu.id, 'degree', v); highlight('education'); }} />
                      <InputField label="Institution" value={edu.institution} placeholder="e.g. University of London"
                        onChange={(v) => { updateEdu(d, setResumeData, edu.id, 'institution', v); highlight('education'); }} />
                      <InputField label="Period" value={edu.period} placeholder="e.g. 2018 – 2022"
                        onChange={(v) => { updateEdu(d, setResumeData, edu.id, 'period', v); highlight('education'); }} />
                      <InputField label="Details (optional)" value={edu.details} placeholder="e.g. First Class Honors, GPA 3.9"
                        onChange={(v) => { updateEdu(d, setResumeData, edu.id, 'details', v); highlight('education'); }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-500 leading-relaxed">Each skill appears as a tag in your resume. Press Enter or comma to add one.</p>
                  <SkillsEditor
                    skills={d.skills}
                    onChange={(skills) => { setResumeData({ ...d, skills }); highlight('skills'); }}
                  />
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Professional Summary</label>
                    <textarea
                      value={d.summary}
                      rows={5}
                      onChange={(e) => { setResumeData({ ...d, summary: e.target.value }); highlight('summary'); }}
                      placeholder="A brief overview of your professional background..."
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/70 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">Update your contact information displayed at the top of your resume.</p>
                  <InputField label="Full Name" value={d.name} placeholder="Jane Smith"
                    onChange={(v) => { setResumeData({ ...d, name: v }); highlight('contact'); }} />
                  <InputField label="Email" value={d.email} placeholder="jane@email.com"
                    onChange={(v) => { setResumeData({ ...d, email: v }); highlight('contact'); }} />
                  <InputField label="Phone" value={d.phone} placeholder="+1 (555) 000-0000"
                    onChange={(v) => { setResumeData({ ...d, phone: v }); highlight('contact'); }} />
                  <InputField label="Location" value={d.location} placeholder="New York, NY"
                    onChange={(v) => { setResumeData({ ...d, location: v }); highlight('contact'); }} />
                  <InputField label="LinkedIn URL" value={d.linkedin} placeholder="linkedin.com/in/janesmith"
                    onChange={(v) => { setResumeData({ ...d, linkedin: v }); highlight('contact'); }} />
                </div>
              )}

              {/* Relevant Courses Tab */}
              {activeTab === 'relevantCourses' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">Edit the relevant courses detected from your resume.</p>
                  <BulletListEditor
                    items={d.relevantCourses}
                    placeholder="e.g. Data Structures and Algorithms"
                    onChange={(items) => { setResumeData({ ...d, relevantCourses: items }); highlight('relevantCourses'); }}
                  />
                </div>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">Add projects, personal work, or portfolio highlights.</p>
                  <BulletListEditor
                    items={d.projects.length > 0 ? d.projects : ['']}
                    placeholder="e.g. Built an AI-powered resume analyzer using React and FastAPI"
                    onChange={(items) => { setResumeData({ ...d, projects: items }); highlight('projects'); }}
                  />
                </div>
              )}

              {/* Professional Affiliations Tab */}
              {activeTab === 'affiliations' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">List memberships, professional organizations, and associations.</p>
                  <BulletListEditor
                    items={d.affiliations.length > 0 ? d.affiliations : ['']}
                    placeholder="e.g. Member, Association for Computing Machinery (ACM)"
                    onChange={(items) => { setResumeData({ ...d, affiliations: items }); highlight('affiliations'); }}
                  />
                </div>
              )}

              {/* Leadership & Management Tab */}
              {activeTab === 'leadership' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">Highlight leadership roles, team management, and initiatives.</p>
                  <BulletListEditor
                    items={d.leadership.length > 0 ? d.leadership : ['']}
                    placeholder="e.g. Led a team of 5 engineers to deliver a product on time"
                    onChange={(items) => { setResumeData({ ...d, leadership: items }); highlight('leadership'); }}
                  />
                </div>
              )}

              {/* Clubs / Affiliations Tab */}
              {activeTab === 'clubs' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">Add clubs, student organizations, and extracurricular groups.</p>
                  <BulletListEditor
                    items={d.clubs.length > 0 ? d.clubs : ['']}
                    placeholder="e.g. President, Computer Science Club"
                    onChange={(items) => { setResumeData({ ...d, clubs: items }); highlight('clubs'); }}
                  />
                </div>
              )}

              {/* Certifications Tab */}
              {activeTab === 'certifications' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">List professional certifications, licenses, and accreditations relevant to your field.</p>
                  <BulletListEditor
                    items={d.certifications.length > 0 ? d.certifications : ['']}
                    placeholder="e.g. PMP Certified, AWS Solutions Architect, Registered Nurse (RN)"
                    onChange={(items) => { setResumeData({ ...d, certifications: items }); highlight('certifications'); }}
                  />
                </div>
              )}

              {/* Volunteer Work Tab */}
              {activeTab === 'volunteer' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">Include volunteer roles, community service, and pro-bono work. Valued in all sectors.</p>
                  <BulletListEditor
                    items={d.volunteer.length > 0 ? d.volunteer : ['']}
                    placeholder="e.g. Volunteer Nurse, Red Cross — 2020–Present"
                    onChange={(items) => { setResumeData({ ...d, volunteer: items }); highlight('volunteer'); }}
                  />
                </div>
              )}

              {/* Awards & Honors Tab */}
              {activeTab === 'awards' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">Add awards, honors, scholarships, and recognition from any sector.</p>
                  <BulletListEditor
                    items={d.awards.length > 0 ? d.awards : ['']}
                    placeholder="e.g. Employee of the Year, Dean's List 2022, National Merit Scholar"
                    onChange={(items) => { setResumeData({ ...d, awards: items }); highlight('awards'); }}
                  />
                </div>
              )}

              {/* Languages Tab */}
              {activeTab === 'languages' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">List languages and proficiency levels. Critical for healthcare, education, government, and international roles.</p>
                  <BulletListEditor
                    items={d.languages.length > 0 ? d.languages : ['']}
                    placeholder="e.g. Spanish — Fluent, French — Conversational"
                    onChange={(items) => { setResumeData({ ...d, languages: items }); highlight('languages'); }}
                  />
                </div>
              )}
            </div>

            {/* bottom actions */}
            <div className="border-t border-zinc-800 p-4 bg-zinc-950">
              <button
                onClick={handleSaveAndContinue}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  isLastTab
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                {isLastTab ? (
                  <>Save &amp; Continue to Job Matching <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Save &amp; Continue <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: regenerating ──────────────────────────────────────────────────────
  if (step === 'regenerating') {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex flex-col items-center justify-center gap-6 p-4">
        <img
          src="/Logo3.png"
          alt="CareerDev AI"
          className="w-20 h-20 object-contain animate-spin"
          style={{ animationDuration: '2s', animationTimingFunction: 'linear' }}
        />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Reorganizing your resume…</h2>
          <p className="text-sm text-zinc-400 max-w-sm">AI is sorting experiences chronologically and cleaning formatting. Takes ~15–30 seconds.</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span key={delay} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── STEP: preview ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f13] flex flex-col">
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
            <CheckCircle className="w-4 h-4" /> AI Reorganized
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStep('editing')} className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Edit
          </button>
          <button
            onClick={() => downloadResumePDF(rewrittenResume, (resumeFile?.name?.replace('.pdf', '') ?? 'resume') + '_ai.pdf')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold text-sm border border-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={() => goToApp(rewrittenResume)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow transition-colors">
            Use This Resume &amp; Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex justify-center bg-zinc-900/40 py-8 px-4 overflow-y-auto">
        <div className="w-full max-w-[700px] space-y-4">
          <div className="flex items-center gap-3 bg-emerald-900/30 border border-emerald-700/40 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300">
              Your resume has been reorganized with experiences sorted most-recent-first. Review and make any final tweaks below.
            </p>
          </div>

          <div className="bg-white shadow-2xl shadow-black/60 rounded-sm pb-8" style={{ fontFamily: "'Georgia', serif" }}>
            <div className="px-12 py-10">
              <RewrittenResumeView text={rewrittenResume} onChange={setRewrittenResume} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function DarkSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-1 h-4 bg-indigo-500 rounded-full flex-shrink-0" />
      <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.18em]">{children}</h3>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.3), transparent)' }} />
    </div>
  );
}

function InputField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/70 transition-colors"
      />
    </div>
  );
}

function BulletListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-indigo-500 text-xs mt-2.5 flex-shrink-0 font-bold">›</span>
          <textarea
            value={item}
            rows={2}
            onChange={(e) => { const u = [...items]; u[i] = e.target.value; onChange(u); }}
            placeholder={placeholder}
            className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/70 resize-none leading-relaxed"
          />
          {items.length > 1 && (
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-zinc-700 hover:text-red-500 flex-shrink-0 mt-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-400 mt-1">
        <Plus className="w-3 h-3" /> Add entry
      </button>
    </div>
  );
}

function SkillsEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState('');
  const addSkill = (raw: string) => {
    const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter((s) => s.length > 0);
    const next = [...skills];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next);
    setInput('');
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          placeholder="Type a skill and press Enter..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (input.trim()) addSkill(input); } }}
          className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/70"
        />
        <button onClick={() => { if (input.trim()) addSkill(input); }} className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-400 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-zinc-800 border border-zinc-700/60 text-zinc-300 rounded-lg">
            {s}
            <button onClick={() => onChange(skills.filter((_, idx) => idx !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function RewrittenResumeView({ text, onChange }: { text: string; onChange: (t: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
        <Edit3 className="w-3.5 h-3.5" /> Click anywhere to make final edits
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[900px] text-sm text-gray-800 leading-relaxed resize-none focus:outline-none bg-transparent"
        style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", lineHeight: '1.8' }}
        spellCheck
      />
    </div>
  );
}

// ─── Immutable update helpers ─────────────────────────────────────────────────

function updateExp(
  d: ResumeData,
  set: React.Dispatch<React.SetStateAction<ResumeData | null>>,
  id: string,
  field: keyof WorkEntry,
  value: any,
) {
  set({ ...d, experience: d.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)) });
}

function updateEdu(
  d: ResumeData,
  set: React.Dispatch<React.SetStateAction<ResumeData | null>>,
  id: string,
  field: keyof EducationEntry,
  value: any,
) {
  set({ ...d, education: d.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)) });
}
