import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Upload, FileText, Zap, CheckCircle, ArrowLeft,
  PenLine, Sparkles, ChevronRight, RefreshCw, AlertCircle,
  Plus, Trash2, GripVertical, Eye, Edit3, Download, Wand2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { rewriteResume, enhanceBullet, extractTextFromResume } from '../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

// Client-side pdfjs path. Used for two purposes:
//  1. Extract clickable link annotations (e.g. GitHub/LinkedIn URLs hidden
//     behind anchor text like "GitHub") — the server can't see these.
//  2. Fallback text extraction if the server endpoint is unavailable.
async function extractPdfWithPdfjs(file: File): Promise<{ text: string; links: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];
  const allLinks = new Set<string>();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const [textContent, annotations] = await Promise.all([
      page.getTextContent(),
      page.getAnnotations().catch(() => [] as any[]),
    ]);

    for (const annot of annotations) {
      if (annot.subtype === 'Link' && typeof annot.url === 'string' && /^https?:\/\//i.test(annot.url)) {
        allLinks.add(annot.url);
      }
    }

    type Item = { x: number; y: number; h: number; text: string };
    const items: Item[] = [];
    for (const it of textContent.items) {
      if (!('str' in it)) continue;
      const str = (it as any).str as string;
      if (!str || !str.trim()) continue;
      const [, , , , x, y] = (it as any).transform as number[];
      const h = Math.abs((it as any).height) || Math.abs((it as any).transform?.[3]) || 10;
      items.push({ x, y, h, text: str });
    }
    if (items.length === 0) continue;

    items.sort((a, b) => b.y - a.y);
    const heights = items.map((i) => i.h).sort((a, b) => a - b);
    const medianH = heights[Math.floor(heights.length / 2)] || 10;
    const tol = Math.max(2, medianH * 0.5);

    const lineBuckets: Item[][] = [];
    for (const item of items) {
      const last = lineBuckets[lineBuckets.length - 1];
      if (last && Math.abs(last[0].y - item.y) <= tol) last.push(item);
      else lineBuckets.push([item]);
    }

    const lines = lineBuckets.map((bucket) => {
      bucket.sort((a, b) => a.x - b.x);
      let out = '';
      for (let i = 0; i < bucket.length; i++) {
        const cur = bucket[i];
        if (i === 0) { out = cur.text; continue; }
        const prev = bucket[i - 1];
        const prevWidth = (prev as any).w ?? Math.max(prev.h * 0.5, prev.text.length * prev.h * 0.45);
        const gap = cur.x - (prev.x + prevWidth);
        const endsWithSpace = /\s$/.test(out);
        const startsWithSpace = /^\s/.test(cur.text);
        if (gap < prev.h * 0.25 || endsWithSpace || startsWithSpace) out += cur.text;
        else out += ' ' + cur.text;
      }
      return out.replace(/\s{2,}/g, ' ').trim();
    }).filter(Boolean);

    if (lines.length) pageTexts.push(lines.join('\n'));
  }

  return { text: pageTexts.join('\n\n'), links: Array.from(allLinks) };
}

// Resume PDF → text. Strategy:
//   1. Call the server's /api/extract-text endpoint in parallel with the
//      client-side pdfjs pass. The server uses PyPDF2 + a tesseract OCR
//      fallback, so it handles scanned/image-only PDFs that pdfjs returns
//      nothing for. The client pdfjs pass is still needed to recover clickable
//      link annotations (GitHub/LinkedIn URLs hidden behind anchor text).
//   2. Pick whichever text source has more substance. If the server returned
//      meaningful text, use it; otherwise fall back to the pdfjs text. This
//      keeps the page working even if the backend is down or rate-limited.
async function extractPdfText(file: File): Promise<{ text: string; links: string[] }> {
  // Fire both off in parallel — the pdfjs pass is needed regardless (for links).
  const pdfjsPromise = extractPdfWithPdfjs(file).catch(() => ({ text: '', links: [] as string[] }));
  const serverPromise = extractTextFromResume(file)
    .then((res: any) => (typeof res?.fullText === 'string' && res.fullText.trim())
      ? res.fullText as string
      : (typeof res?.text === 'string' ? res.text as string : ''))
    .catch(() => '');

  const [pdfjsResult, serverText] = await Promise.all([pdfjsPromise, serverPromise]);

  // Prefer the server text when it has materially more content (it has OCR);
  // otherwise stay with pdfjs (which preserves visual layout / line order
  // better for well-formed text PDFs).
  const serverLen = serverText.trim().length;
  const clientLen = pdfjsResult.text.trim().length;
  const chosen = serverLen > Math.max(50, clientLen * 0.8) ? serverText : pdfjsResult.text;

  return { text: chosen, links: pdfjsResult.links };
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

interface CustomSection {
  heading: string;
  content: string[];
}

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string[];
  experience: WorkEntry[];
  education: EducationEntry[];
  certifications: string[];
  relevantCourses: string[];
  // Projects use the same structured shape as Experience so each project can
  // show its name, tech stack / context, period and bullet highlights.
  projects: WorkEntry[];
  affiliations: string[];
  // Leadership uses the same structured shape as Experience so each role
  // can show its title, organization, period and bullet achievements.
  leadership: WorkEntry[];
  clubs: string[];
  volunteer: string[];
  awards: string[];
  languages: string[];
  // Catches any heading not in SECTION_MAP (Publications, Research, Patents, etc.)
  // so content under unrecognized sections isn't silently discarded.
  customSections: CustomSection[];
}

// Parses a section's lines (e.g. Experience or Leadership) into structured
// WorkEntry[]. Handles bullets, pipe/at/comma-separated headers, dates, and
// long combined-header lines that mix title + company + location + dates.
function parseWorkEntries(lines: string[]): WorkEntry[] {
  const entries: WorkEntry[] = [];
  let current: WorkEntry | null = null;

  const MONTHS = /jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?/i;
  const containsDate = (l: string) => /\d{4}/.test(l) || MONTHS.test(l) || /present|current/i.test(l);
  const isDateRange  = (l: string) =>
    /(\d{4}|present).*?[–\-—].*?(\d{4}|present)/i.test(l) ||
    new RegExp(`(${MONTHS.source}[,\\s]+\\d{4})\\s*[–\\-—]\\s*(${MONTHS.source}[,\\s]+\\d{4}|present)`, 'i').test(l);
  const isBullet = (l: string) => /^[•\-*–▪▸→]/.test(l);

  const DATE_SPAN = new RegExp(
    `(?:${MONTHS.source}\\.?\\s+\\d{2,4}|\\d{4})` +
    `(?:\\s*[–\\-—]\\s*(?:Present|Current|(?:${MONTHS.source}\\.?\\s+\\d{2,4}|\\d{4})))?` +
    `|(?:${MONTHS.source}\\.?\\s*[–\\-—]\\s*${MONTHS.source}\\.?\\s+\\d{4})`,
    'i'
  );

  const pushCurrent = () => { if (current) { entries.push(current); current = null; } };
  const newId = () => Math.random().toString(36).slice(2);

  for (const line of lines) {
    if (isBullet(line)) {
      if (current) current.bullets.push(line.replace(/^[•\-*–▪▸→]\s*/, ''));
      continue;
    }

    const pipeMatch = line.match(/^(.+?)\s*[|·]\s*(.+?)\s*[|·]\s*(.+)$/);
    const atMatch   = line.match(/^(.+?)\s+(?:at|@)\s+(.+?)\s*[,—–]\s*(\d.+|present.*)$/i);

    if (pipeMatch && containsDate(pipeMatch[3])) {
      pushCurrent();
      current = { id: newId(), title: pipeMatch[1].trim(), company: pipeMatch[2].trim(), period: pipeMatch[3].trim(), bullets: [] };
      continue;
    }
    if (atMatch && containsDate(atMatch[3])) {
      pushCurrent();
      current = { id: newId(), title: atMatch[1].trim(), company: atMatch[2].trim(), period: atMatch[3].trim(), bullets: [] };
      continue;
    }

    // "Title, Company, [Location,] Date" — find the date span, split prefix by comma.
    const dateMatch = line.match(DATE_SPAN);
    if (dateMatch && dateMatch.index !== undefined && line.indexOf(',') >= 0 && line.indexOf(',') < dateMatch.index) {
      const period = dateMatch[0].trim();
      const headerPart = line.slice(0, dateMatch.index).trim().replace(/[,\s.]+$/, '');
      const parts = headerPart.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        pushCurrent();
        current = { id: newId(), title: parts[0], company: parts[1], period, bullets: [] };
        continue;
      }
    }

    if (isDateRange(line) || (containsDate(line) && line.length < 70)) {
      if (current && !current.period) { current.period = line; continue; }
    }

    // Wrapped-bullet continuation: pdfjs splits a single visual bullet into
    // separate lines whenever the text wraps. The first line has the bullet
    // marker, the rest don't. If we're already inside an entry that has at
    // least one bullet and a plain line shows up (no bullet, no new-entry
    // header), it's almost always the tail of the previous bullet — append
    // it rather than spawning a phantom "title-only" entry.
    if (current && current.bullets.length > 0) {
      const lastIdx = current.bullets.length - 1;
      current.bullets[lastIdx] = (current.bullets[lastIdx] + ' ' + line).trim();
      continue;
    }

    if (line.length > 2 && line.length < 200) {
      if (!current) {
        current = { id: newId(), title: line, company: '', period: '', bullets: [] };
      } else if (!current.company && !current.period && current.bullets.length === 0) {
        current.company = line;
      } else {
        pushCurrent();
        current = { id: newId(), title: line, company: '', period: '', bullets: [] };
      }
    }
  }
  pushCurrent();
  return entries;
}

function parseResumeText(raw: string, links: string[] = []): ResumeData {
  // Normalize various bullet/marker characters used by different PDFs to a
  // single canonical "•". Without this, e.g. "●" (U+25CF, "BLACK CIRCLE" —
  // common in Word/Google Docs exports) is treated as plain text and bullets
  // get mis-parsed as titles.
  const allLines = raw.split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[●◦▪▫■□★►▶▸→]\s*/, '• '));

  const data: ResumeData = {
    name: '', email: '', phone: '', location: '', linkedin: '', github: '',
    summary: '', skills: [], experience: [], education: [], certifications: [], relevantCourses: [],
    projects: [], affiliations: [], leadership: [] as WorkEntry[], clubs: [], volunteer: [], awards: [], languages: [],
    customSections: [],
  };

  // ── Contact extraction (scan first 12 lines) ─────────────────────────────
  // pdfjs frequently inserts spurious spaces between adjacent text runs, so an
  // email rendered as "jahatehs@berea.edu" may arrive as "jahatehs @berea.edu"
  // or "jahatehs @ berea . edu". We match a tolerant pattern, then strip out
  // the spaces to get the canonical form.
  const contactBlock = allLines.slice(0, 12).join(' ');
  const emailMatch   = contactBlock.match(/[\w.+\-]+\s*@\s*[\w\-]+(?:\s*\.\s*[\w\-]+)+/);
  // Phone: allow multiple separator chars between groups so "(859) - 979 - 4551" matches.
  const phoneMatch   = contactBlock.match(/(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]{0,3}\d{3}[\s.\-]{0,3}\d{4}|\+\d[\d\s\-().]{6,18}/);
  const linkedinVisibleMatch = contactBlock.match(/linkedin\.com\/in\/[\w%-]+/i);
  const githubVisibleMatch   = contactBlock.match(/github\.com\/[\w%-]+/i);

  // Prefer URLs from PDF link annotations — covers the common case where the
  // resume shows the bare word "GitHub" or "LinkedIn" with the URL hidden in
  // a clickable anchor that getTextContent() can't see.
  const linkedinFromAnnotation = links.find((u) => /linkedin\.com\/in\//i.test(u));
  const githubFromAnnotation   = links.find((u) => /github\.com\//i.test(u) && !/github\.com\/?$/i.test(u));
  const emailFromAnnotation    = links.find((u) => /^mailto:/i.test(u));

  if (emailFromAnnotation) {
    data.email = emailFromAnnotation.replace(/^mailto:/i, '').trim();
  } else if (emailMatch) {
    data.email = emailMatch[0].replace(/\s+/g, '');
  }
  // Normalize phone whitespace so "(859) 302 - 5792" displays as "(859) 302-5792".
  if (phoneMatch) data.phone = phoneMatch[0].replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
  if (linkedinFromAnnotation) {
    data.linkedin = linkedinFromAnnotation.replace(/^https?:\/\/(www\.)?/i, '');
  } else if (linkedinVisibleMatch) {
    data.linkedin = linkedinVisibleMatch[0];
  }
  if (githubFromAnnotation) {
    data.github = githubFromAnnotation.replace(/^https?:\/\/(www\.)?/i, '');
  } else if (githubVisibleMatch) {
    data.github = githubVisibleMatch[0];
  }

  // Name: first line, stripped of any contact details it might contain
  let nameRaw = allLines[0] || '';
  [emailMatch?.[0], phoneMatch?.[0], linkedinVisibleMatch?.[0], githubVisibleMatch?.[0]]
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
  // Patterns end with `(?:\s*[&/]\s*\w+)?` where appropriate so combinations
  // like "Leadership & Affiliations", "Experience & Internships", "Education &
  // Training" still resolve to the closest known section instead of getting
  // dropped or routed to an orphan custom section.
  const SECTION_MAP: [RegExp, string][] = [
    [/^(?:professional\s+)?summary$|^objective$|^professional\s+profile$|^career\s+(?:summary|objective|profile)$|^profile$|^about(?:\s+me)?$/i, 'summary'],
    [/^(?:work\s+|professional\s+|relevant\s+)?experiences?(?:\s+[&\/]\s+\w[\w\s]{0,20})?$|^work\s+history$|^employment(?:\s+history)?$|^career\s+history$|^internships?(?:\s+[&\/]\s+\w[\w\s]{0,20})?$/i, 'experience'],
    [/^education(?:\s+background|\s+[&\/]\s+\w[\w\s]{0,20})?$|^academic\s+(?:background|history)$|^qualifications?$/i, 'education'],
    [/^(?:technical\s+)?skills?(?:\s+[&\/]\s*\w[\w\s]{0,20})?$|^(?:core\s+)?competencies$|^expertise$|^areas?\s+of\s+expertise$|^proficiencies$/i, 'skills'],
    [/^certifications?(?:\s+[&\/]\s*licen[sc]es?)?$|^licen[sc]es?(?:\s+[&\/]\s*certifications?)?$|^professional\s+certifications?$/i, 'certifications'],
    [/^relevant\s+courses?$|^coursework$|^related\s+courses?$|^selected\s+coursework$/i, 'relevantCourses'],
    [/^projects?(?:\s+[&\/]\s*\w[\w\s]{0,20})?$|^portfolio$|^personal\s+projects?$|^selected\s+projects?$|^technical\s+projects?$|^key\s+projects?$|^[\w\s]{0,40}\s+projects?$/i, 'projects'],
    [/^professional\s+affiliations?$|^memberships?$|^associations?$/i, 'affiliations'],
    // Match "Leadership", "Leadership & Management", "Leadership & Affiliations",
    // "Leadership & Activities", "Leadership Experience", etc.
    [/^leadership(?:\s+[&\/]\s*\w[\w\s]{0,20}|\s+experience|\s+roles?)?$|^management\s+experience$/i, 'leadership'],
    [/^clubs?(?:\s*[\/&]\s*\w[\w\s]{0,20})?$|^extracurricular(?:\s+activities)?$|^activities$/i, 'clubs'],
    [/^volunteer(?:ing|s?\s+work|\s+experience)?$|^community\s+service$|^community\s+(?:involvement|engagement)$/i, 'volunteer'],
    [/^awards?(?:\s+[&\/]\s*honors?)?$|^honors?(?:\s+[&\/]\s*awards?)?$|^recognitions?$|^achievements?$|^accolades$/i, 'awards'],
    [/^languages?(?:\s+(?:skills?|proficiency))?$/i, 'languages'],
  ];

  // Heuristic for a line that LOOKS like a section heading but isn't in the known map.
  // We use this to capture "PUBLICATIONS", "RESEARCH", "PATENTS", "PRESENTATIONS",
  // "INTERESTS", "REFERENCES", "TRAINING", etc. as custom sections instead of dropping
  // their content. Title-Case detection is gated by `allowTitleCase` because Title-Case
  // lines also appear as names ("Isaac Kwame Narteh") and company/institution names
  // ("Berea College", "Goldman Sachs Inc") which must not be misread as headings.
  const isLikelyHeading = (line: string, allowTitleCase: boolean): boolean => {
    const trimmed = line.trim().replace(/:$/, '');
    if (trimmed.length < 3 || trimmed.length > 50) return false;
    // ALL-CAPS short line — always treated as a heading candidate.
    if (/^[A-Z][A-Z\s&\/.]{2,40}$/.test(trimmed)) return true;
    // Title-Case — only when we're explicitly between sections.
    if (allowTitleCase && /^[A-Z][A-Za-z]+(?:\s+[A-Z&\/][A-Za-z]*){0,5}$/.test(trimmed) && !/[.!?]$/.test(trimmed)) return true;
    return false;
  };

  const detectSection = (line: string): string | null => {
    if (line.length > 65) return null;
    // Strip trailing colon AND any trailing punctuation so "Education:" /
    // "Experience ." / "Skills —" still match. Some PDFs render an underline
    // glyph or em-dash right after the heading text.
    const trimmed = line.trim().replace(/[\s:.\-–—_]+$/, '');
    for (const [pat, key] of SECTION_MAP) {
      if (pat.test(trimmed)) return key;
    }
    // Also try matching after lower-casing — handles ALL-CAPS headings like
    // "WORK EXPERIENCE", "EDUCATION", and mixed-case oddities. Strip everything
    // that isn't a letter, ampersand or space so "Experience |" / "Skills •"
    // still resolves cleanly.
    const lower = trimmed.toLowerCase().replace(/[^a-z\s&\/]/g, '').replace(/\s+/g, ' ').trim();
    if (lower) {
      for (const [pat, key] of SECTION_MAP) {
        if (pat.test(lower)) return key;
      }
    }
    // Letter-spaced ALL-CAPS headings (e.g. "S U M M A R Y", "E D U C A T I O N",
    // "S O F T W A R E   E N G I N E E R I N G   P R O J E C T S"). Designers
    // use CSS letter-spacing to make headings airy; PDF exporters bake those
    // spaces into the text stream. Detect this pattern (mostly single-letter
    // tokens) and try matching the collapsed form against SECTION_MAP.
    const tokens = trimmed.split(/\s+/);
    const singleCharTokens = tokens.filter((t) => t.length === 1 && /[A-Za-z&\/]/.test(t)).length;
    if (tokens.length >= 4 && singleCharTokens / tokens.length >= 0.6) {
      // Collapse runs of single letters into words. Multi-letter tokens (rare
      // in this case) become a single token; gaps between words are preserved
      // by treating an existing multi-letter token as a word boundary.
      const collapsed = trimmed
        .replace(/\s+/g, ' ')
        .split(/\s{2,}/)                              // double-space → word gap
        .map((chunk) => chunk.replace(/\s+/g, ''))    // single spaces → join
        .join(' ')
        .toLowerCase();
      for (const [pat, key] of SECTION_MAP) {
        if (pat.test(collapsed)) return key;
      }
      // Fallback: collapse ALL whitespace and retry. Some PDFs use just single
      // spaces between every letter, so the "double-space = word gap" trick
      // above won't help — try the maximally-collapsed form as a last resort.
      const fullyCollapsed = trimmed.replace(/\s+/g, '').toLowerCase();
      for (const [pat, key] of SECTION_MAP) {
        if (pat.test(fullyCollapsed)) return key;
      }
    }
    return null;
  };

  let currentSection = '';
  const sectionContent: Record<string, string[]> = {};
  // Collect content under headings we don't recognize (Publications, Research, Patents, etc.)
  // Key = the raw heading as it appeared in the resume; value = the lines under it.
  const customContent: Record<string, string[]> = {};
  // Track which key is currently active so we can route lines correctly.
  let currentCustomKey = '';
  // Suppress heading detection until we've seen a real section heading. This
  // prevents the name ("Isaac Kwame Narteh") and the contact line from being
  // misread as a custom section header at the top of the resume.
  let sawSection = false;

  for (const line of allLines) {
    const detected = detectSection(line);
    if (detected) {
      sawSection = true;
      currentSection = detected;
      currentCustomKey = '';
      if (!sectionContent[currentSection]) sectionContent[currentSection] = [];
      continue;
    }
    // Heading-shaped line that isn't in SECTION_MAP → start a custom section.
    // Only consider Title-Case as a heading when we're between sections;
    // inside a section, a Title-Case line is almost always a job title or
    // company name and must stay with its parent section.
    if (sawSection) {
      const allowTitleCase = !currentSection;
      if (isLikelyHeading(line, allowTitleCase)) {
        currentSection = '';
        currentCustomKey = line.trim().replace(/:$/, '');
        if (!customContent[currentCustomKey]) customContent[currentCustomKey] = [];
        continue;
      }
    }
    if (currentSection) {
      sectionContent[currentSection].push(line);
    } else if (currentCustomKey) {
      customContent[currentCustomKey].push(line);
    }
  }

  // Materialize custom sections, skipping any with no meaningful content.
  data.customSections = Object.entries(customContent)
    .map(([heading, lines]) => ({
      heading,
      content: lines.map((l) => l.replace(/^[•\-*–▪]\s*/, '').trim()).filter((l) => l.length > 1),
    }))
    .filter((s) => s.content.length > 0);

  // ── Summary ───────────────────────────────────────────────────────────────
  if (sectionContent['summary']) {
    data.summary = sectionContent['summary'].join(' ').replace(/\s{2,}/g, ' ').trim();
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
    data.skills = Array.from(new Set(skills));
  }

  // ── Experience + Leadership + Projects (same structural shape) ───────────
  if (sectionContent['experience']) {
    data.experience = parseWorkEntries(sectionContent['experience']);
  }
  if (sectionContent['leadership']) {
    data.leadership = parseWorkEntries(sectionContent['leadership']);
  }
  if (sectionContent['projects']) {
    data.projects = parseWorkEntries(sectionContent['projects']);
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
  // No item-count caps — the user wants ALL content from the PDF to surface.
  const simpleList = (key: string) =>
    (sectionContent[key] || [])
      .map((l) => l.replace(/^[•\-*–▪]\s*/, '').trim())
      .filter((l) => l.length > 2);

  data.certifications  = simpleList('certifications');
  data.affiliations    = simpleList('affiliations');
  // Note: leadership and projects are parsed as structured WorkEntry[] earlier (same shape as Experience).
  data.clubs           = simpleList('clubs');
  data.volunteer       = simpleList('volunteer');
  data.awards          = simpleList('awards');

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
  const contact = [d.email, d.phone, d.location, d.linkedin, d.github].filter(Boolean).join(' | ');
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
    for (const e of d.projects) {
      lines.push(e.title + (e.company ? ` — ${e.company}` : ''));
      if (e.period) lines.push(e.period);
      for (const b of e.bullets) lines.push(`• ${b}`);
      lines.push('');
    }
  }
  if (d.affiliations.length) {
    lines.push('PROFESSIONAL AFFILIATIONS');
    for (const a of d.affiliations) lines.push(`• ${a}`);
    lines.push('');
  }
  if (d.leadership.length) {
    lines.push('LEADERSHIP & MANAGEMENT');
    for (const e of d.leadership) {
      lines.push(e.title + (e.company ? ` — ${e.company}` : ''));
      if (e.period) lines.push(e.period);
      for (const b of e.bullets) lines.push(`• ${b}`);
      lines.push('');
    }
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
  for (const sec of d.customSections) {
    lines.push(sec.heading.toUpperCase());
    for (const c of sec.content) lines.push(`• ${c}`);
    lines.push('');
  }
  return lines.join('\n');
}

// Non-destructive merge: AI's structured fields win where it produced content,
// raw fills any gaps the AI dropped. CustomSections are unioned by heading.
function mergeResumeData(raw: ResumeData, ai: ResumeData): ResumeData {
  const pickStr = (a: string, b: string) => (a && a.trim().length > 0 ? a : b);
  const pickArr = <T,>(a: T[], b: T[]) => (a.length > 0 ? a : b);

  const aiHeadings = new Set(ai.customSections.map((s) => s.heading.toLowerCase()));
  const mergedCustom = [
    ...ai.customSections,
    ...raw.customSections.filter((s) => !aiHeadings.has(s.heading.toLowerCase())),
  ];

  return {
    name:            pickStr(ai.name, raw.name),
    email:           pickStr(ai.email, raw.email),
    phone:           pickStr(ai.phone, raw.phone),
    location:        pickStr(ai.location, raw.location),
    linkedin:        pickStr(ai.linkedin, raw.linkedin),
    github:          pickStr(ai.github, raw.github),
    summary:         pickStr(ai.summary, raw.summary),
    skills:          pickArr(ai.skills, raw.skills),
    experience:      pickArr(ai.experience, raw.experience),
    education:       pickArr(ai.education, raw.education),
    certifications:  pickArr(ai.certifications, raw.certifications),
    relevantCourses: pickArr(ai.relevantCourses, raw.relevantCourses),
    projects:        pickArr(ai.projects, raw.projects),
    affiliations:    pickArr(ai.affiliations, raw.affiliations),
    leadership:      pickArr(ai.leadership, raw.leadership),
    clubs:           pickArr(ai.clubs, raw.clubs),
    volunteer:       pickArr(ai.volunteer, raw.volunteer),
    awards:          pickArr(ai.awards, raw.awards),
    languages:       pickArr(ai.languages, raw.languages),
    customSections:  mergedCustom,
  };
}

type Step = 'choice' | 'uploading' | 'organizing' | 'editing' | 'regenerating' | 'preview';
type EditorTab = 'contact' | 'education' | 'skills' | 'relevantCourses' | 'experience' | 'projects' | 'certifications' | 'affiliations' | 'leadership' | 'clubs' | 'volunteer' | 'awards' | 'languages';

// ── Dark-theme palette for the onboarding flow ─────────────────────────────
// Derived from the project palette (https://colorhunt.co/palette/1f6f5f2fa0846fcf97eeeeee).
// Default cards step from an emerald tint INTO deep teal so each card sweeps
// the green palette dark-to-light. Active cards push deeper toward the teal
// primary for emphasis. The bright spring green is reserved for the highlight
// border so the only bright-on-dark contrast in the UI marks the active state.
const DARK = {
  bgBase:        '#0C2C27',  // teal-900 — page background (deep teal-green)
  bgRaised:      '#13423A',  // teal-800 — preview pane background
  cardFrom:      '#175040',  // emerald-800 — card gradient start
  cardTo:        '#1F6A57',  // emerald-700 — card gradient end
  cardActiveFrom:'#26856D',  // emerald-600 — active card start
  cardActiveTo:  '#1F6F5F',  // brand-primary (deep teal) — active card end
  borderDefault: '#26856D',  // emerald-600 — default border
  borderActive:  '#6FCF97',  // brand-secondary (light spring green) — active border pops
};

// Polished, shared loading screen used by both the initial "organizing" step
// and the "regenerating" step. Advances through a step list on a timer so the
// user has a sense of progress while waiting on the AI call (which doesn't
// stream progress events).
interface ProcessingLoaderProps {
  title: string;
  subtitle: string;
  steps: string[];
  fileName?: string;
}

const ProcessingLoader: React.FC<ProcessingLoaderProps> = ({ title, subtitle, steps, fileName }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((i) => Math.min(i + 1, steps.length - 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft radial glow backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0) 60%)',
        }}
      />
      {/* Faint grid texture for depth */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-indigo-950/40">
          {/* Logo with calm pulse glow */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 rounded-2xl blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                <img src="/Logo3.png" alt="" className="w-9 h-9 object-contain" />
              </div>
            </div>
          </div>

          {/* Title + subtitle */}
          <div className="text-center mb-7">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">{title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{subtitle}</p>
          </div>

          {/* Animated step checklist */}
          <ul className="space-y-3 mb-7">
            {steps.map((step, idx) => {
              const isDone = idx < activeIdx;
              const isActive = idx === activeIdx;
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? 'bg-indigo-500'
                        : isActive
                        ? 'bg-indigo-500/15 border border-indigo-500/60'
                        : 'bg-zinc-800/80 border border-zinc-700/60'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-3 h-3 text-white" />
                    ) : isActive ? (
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                    ) : null}
                  </span>
                  <span
                    className={`text-sm transition-colors duration-300 ${
                      isDone ? 'text-zinc-500' : isActive ? 'text-white font-medium' : 'text-zinc-600'
                    }`}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Shimmer progress bar */}
          <div className="relative h-1 bg-zinc-800/80 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full"
              style={{ animation: 'gs-shimmer 1.8s ease-in-out infinite' }}
            />
          </div>

          {/* File chip */}
          {fileName && (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-950/60 border border-zinc-800 rounded-full px-3 py-1 max-w-full">
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{fileName}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gs-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

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
      const { text, links } = await extractPdfText(file);
      if (!text || text.length < 50) throw new Error('Could not read text from this PDF. The file may be corrupted or empty — try re-exporting it or pasting your resume text manually.');

      // Parse the raw extracted text first — this is the lossless baseline.
      // If the AI rewrite step drops a section (e.g. "Publications"), the raw
      // parse will still have it and we'll merge it back in.
      // PDF link annotations are passed in so we can recover GitHub/LinkedIn
      // URLs that only appear as clickable words (no visible URL in the text).
      const rawParsed = parseResumeText(text, links);

      setStep('organizing');
      let finalData: ResumeData = rawParsed;
      try {
        const result = await rewriteResume(text);
        if (result.rewrittenResume && result.rewrittenResume.length >= 50) {
          const aiParsed = parseResumeText(result.rewrittenResume, links);
          finalData = mergeResumeData(rawParsed, aiParsed);
        }
      } catch {
        // AI rewrite failed — keep the raw parse so the user still sees everything.
      }

      setResumeData(finalData);
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
      <div className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
            <div className="group relative bg-zinc-900/80 backdrop-blur rounded-2xl border border-zinc-800 hover:border-emerald-500/70 shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-7 flex flex-col gap-5 h-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Start Job Matching</h2>
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

            <div className="group relative bg-zinc-900/80 backdrop-blur rounded-2xl border border-zinc-800 hover:border-indigo-500/70 shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-7 flex flex-col gap-5 h-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Update My Resume First</h2>
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
          </div>

          <p className="text-center text-xs text-zinc-600">You can always upload or update your resume inside the app.</p>
        </div>
      </div>
    );
  }

  // ── STEP: organizing — AI formats extracted text ──────────────────────────
  if (step === 'organizing') {
    return (
      <ProcessingLoader
        title="Organizing your resume"
        subtitle="Hang tight — this usually takes 15 to 30 seconds."
        steps={[
          'Extracting text from your PDF',
          'Detecting sections and structure',
          'AI cleaning and reorganizing',
          'Building your live preview',
        ]}
        fileName={resumeFile?.name}
      />
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
      <div className="h-screen bg-blue-950 flex flex-col overflow-hidden">
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
          <div className="flex-1 overflow-y-auto flex flex-col items-center py-8 px-4 border-r border-zinc-800" style={{ background: DARK.bgRaised }}>
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
                    ? `linear-gradient(135deg, ${DARK.cardActiveFrom} 0%, ${DARK.cardActiveTo} 100%)`
                    : `linear-gradient(135deg, ${DARK.cardFrom} 0%, ${DARK.cardTo} 100%)`,
                  borderColor: highlightSection === 'contact' ? DARK.borderActive : DARK.borderDefault,
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
                  {d.github && <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />{d.github}</span>}
                </div>
              </div>

              {/* Summary */}
              {d.summary && (
                <div
                  ref={(el) => { previewRefs.current['summary'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'summary' ? DARK.borderActive : DARK.borderDefault }}
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
                  style={{ borderColor: highlightSection === 'education' ? DARK.borderActive : DARK.borderDefault }}
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
                  style={{ borderColor: highlightSection === 'skills' ? DARK.borderActive : DARK.borderDefault }}
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
                  style={{ borderColor: highlightSection === 'relevantCourses' ? DARK.borderActive : DARK.borderDefault }}
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
                  style={{ borderColor: highlightSection === 'experience' ? DARK.borderActive : DARK.borderDefault }}
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
                                <span className="text-indigo-500 flex-shrink-0 font-bold mt-0.5">•</span> {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects — same structured layout as Experience */}
              {d.projects.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['projects'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'projects' ? DARK.borderActive : DARK.borderDefault }}
                >
                  <DarkSectionLabel>Projects</DarkSectionLabel>
                  <div className="mt-3 space-y-4">
                    {d.projects.map((exp) => (
                      <div key={exp.id} className="pl-3 border-l-2 border-indigo-900">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="text-[13px] text-indigo-300 italic">
                            {exp.title || <span className="text-zinc-600">Project Name</span>}
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
                                <span className="text-indigo-500 flex-shrink-0 font-bold mt-0.5">•</span> {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Affiliations */}
              {d.affiliations.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['affiliations'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'affiliations' ? DARK.borderActive : DARK.borderDefault }}
                >
                  <DarkSectionLabel>Professional Affiliations</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.affiliations.map((a, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">•</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Leadership & Management — same structured layout as Experience */}
              {d.leadership.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['leadership'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'leadership' ? DARK.borderActive : DARK.borderDefault }}
                >
                  <DarkSectionLabel>Leadership &amp; Management</DarkSectionLabel>
                  <div className="mt-3 space-y-4">
                    {d.leadership.map((exp) => (
                      <div key={exp.id} className="pl-3 border-l-2 border-indigo-900">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="text-[13px] text-indigo-300 italic">
                            {exp.title || <span className="text-zinc-600">Role / Organization</span>}
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
                                <span className="text-indigo-500 flex-shrink-0 font-bold mt-0.5">•</span> {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clubs / Affiliations */}
              {d.clubs.length > 0 && (
                <div
                  ref={(el) => { previewRefs.current['clubs'] = el; }}
                  className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                  style={{ borderColor: highlightSection === 'clubs' ? DARK.borderActive : DARK.borderDefault }}
                >
                  <DarkSectionLabel>Clubs / Affiliations</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.clubs.map((c, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">•</span> {c}
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
                  style={{ borderColor: highlightSection === 'certifications' ? DARK.borderActive : DARK.borderDefault }}
                >
                  <DarkSectionLabel>Certifications</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.certifications.map((c, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">•</span> {c}
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
                  style={{ borderColor: highlightSection === 'volunteer' ? DARK.borderActive : DARK.borderDefault }}
                >
                  <DarkSectionLabel>Volunteer Work</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.volunteer.map((v, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">•</span> {v}
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
                  style={{ borderColor: highlightSection === 'awards' ? DARK.borderActive : DARK.borderDefault }}
                >
                  <DarkSectionLabel>Awards &amp; Honors</DarkSectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {d.awards.map((a, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-zinc-400">
                        <span className="text-indigo-500 flex-shrink-0 font-bold">•</span> {a}
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
                  style={{ borderColor: highlightSection === 'languages' ? DARK.borderActive : DARK.borderDefault }}
                >
                  <DarkSectionLabel>Languages</DarkSectionLabel>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {d.languages.map((l, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 bg-zinc-800 border border-zinc-700/60 text-zinc-300 rounded-md">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom sections — any heading not in SECTION_MAP (Publications, Research, etc.) */}
              {d.customSections.map((sec, idx) => {
                const refKey = `custom-${idx}`;
                return (
                  <div
                    key={refKey}
                    ref={(el) => { previewRefs.current[refKey] = el; }}
                    className="bg-zinc-900/80 border rounded-xl p-4 transition-all duration-500"
                    style={{ borderColor: highlightSection === refKey ? DARK.borderActive : DARK.borderDefault }}
                  >
                    <DarkSectionLabel>{sec.heading}</DarkSectionLabel>
                    <ul className="mt-2.5 space-y-1.5">
                      {sec.content.map((line, i) => (
                        <li key={i} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                          <span className="text-zinc-500 flex-shrink-0">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

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
                  <InputField label="GitHub URL" value={d.github} placeholder="github.com/janesmith"
                    onChange={(v) => { setResumeData({ ...d, github: v }); highlight('contact'); }} />
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

              {/* Projects Tab — same structured editor as Experience */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500 leading-relaxed">Add or edit projects. Each project can have a name, tech stack / context, period and bullet highlights.</p>
                    <button
                      onClick={() => {
                        const newEntry: WorkEntry = { id: Math.random().toString(36).slice(2), title: '', company: '', period: '', bullets: [''] };
                        setResumeData({ ...d, projects: [newEntry, ...d.projects] });
                        scrollAndHighlight('projects');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {d.projects.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                      <p className="text-zinc-600 text-sm">No project entries yet.</p>
                      <p className="text-zinc-700 text-xs mt-1">Click "Add" to create one.</p>
                    </div>
                  )}

                  {d.projects.map((exp, idx) => (
                    <div key={exp.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 space-y-3 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-600">
                          <GripVertical className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold text-zinc-500">PROJECT {idx + 1}</span>
                        </div>
                        <button
                          onClick={() => { setResumeData({ ...d, projects: d.projects.filter((e) => e.id !== exp.id) }); scrollAndHighlight('projects'); }}
                          className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <InputField label="Project Name" value={exp.title} placeholder="e.g. AI Resume Analyzer"
                        onChange={(v) => { updateProject(d, setResumeData, exp.id, 'title', v); highlight('projects'); }} />
                      <InputField label="Tech Stack / Context" value={exp.company} placeholder="e.g. React, TypeScript, FastAPI"
                        onChange={(v) => { updateProject(d, setResumeData, exp.id, 'company', v); highlight('projects'); }} />
                      <InputField label="Period" value={exp.period} placeholder="e.g. Jan 2024 – Present"
                        onChange={(v) => { updateProject(d, setResumeData, exp.id, 'period', v); highlight('projects'); }} />
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bullet Points</label>
                          <button
                            onClick={() => { updateProject(d, setResumeData, exp.id, 'bullets', [...exp.bullets, '']); highlight('projects'); }}
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
                                updateProject(d, setResumeData, exp.id, 'bullets', updated);
                                highlight('projects');
                              }}
                              placeholder="Describe an achievement, technical decision, or outcome..."
                              className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/70 resize-none leading-relaxed"
                            />
                            <div className="flex flex-col gap-1 flex-shrink-0 mt-1">
                              <button
                                title="AI enhance this bullet"
                                disabled={enhancingBullet === `proj:${exp.id}:${bi}`}
                                onClick={async () => {
                                  if (!b.trim()) return;
                                  const key = `proj:${exp.id}:${bi}`;
                                  setEnhancingBullet(key);
                                  try {
                                    const res = await enhanceBullet(b, exp.title, exp.company);
                                    if (res.success && res.enhanced) {
                                      const updated = [...exp.bullets];
                                      updated[bi] = res.enhanced;
                                      updateProject(d, setResumeData, exp.id, 'bullets', updated);
                                      highlight('projects');
                                    }
                                  } finally {
                                    setEnhancingBullet(null);
                                  }
                                }}
                                className="text-indigo-500/70 hover:text-indigo-400 disabled:opacity-40 disabled:cursor-wait transition-colors"
                              >
                                {enhancingBullet === `proj:${exp.id}:${bi}`
                                  ? <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin block" />
                                  : <Wand2 className="w-3.5 h-3.5" />}
                              </button>
                              {exp.bullets.length > 1 && (
                                <button
                                  onClick={() => { updateProject(d, setResumeData, exp.id, 'bullets', exp.bullets.filter((_, i) => i !== bi)); }}
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

              {/* Leadership & Management Tab — same structured editor as Experience */}
              {activeTab === 'leadership' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500 leading-relaxed">Add or edit leadership roles. Each role can have a title, organization, period and bullet achievements.</p>
                    <button
                      onClick={() => {
                        const newEntry: WorkEntry = { id: Math.random().toString(36).slice(2), title: '', company: '', period: '', bullets: [''] };
                        setResumeData({ ...d, leadership: [newEntry, ...d.leadership] });
                        scrollAndHighlight('leadership');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {d.leadership.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                      <p className="text-zinc-600 text-sm">No leadership entries yet.</p>
                      <p className="text-zinc-700 text-xs mt-1">Click "Add" to create one.</p>
                    </div>
                  )}

                  {d.leadership.map((exp, idx) => (
                    <div key={exp.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 space-y-3 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-600">
                          <GripVertical className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold text-zinc-500">ROLE {idx + 1}</span>
                        </div>
                        <button
                          onClick={() => { setResumeData({ ...d, leadership: d.leadership.filter((e) => e.id !== exp.id) }); scrollAndHighlight('leadership'); }}
                          className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <InputField label="Role / Title" value={exp.title} placeholder="e.g. Vice President"
                        onChange={(v) => { updateLeadership(d, setResumeData, exp.id, 'title', v); highlight('leadership'); }} />
                      <InputField label="Organization" value={exp.company} placeholder="e.g. African Students Association"
                        onChange={(v) => { updateLeadership(d, setResumeData, exp.id, 'company', v); highlight('leadership'); }} />
                      <InputField label="Period" value={exp.period} placeholder="e.g. May 2023 – Present"
                        onChange={(v) => { updateLeadership(d, setResumeData, exp.id, 'period', v); highlight('leadership'); }} />
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bullet Points</label>
                          <button
                            onClick={() => { updateLeadership(d, setResumeData, exp.id, 'bullets', [...exp.bullets, '']); highlight('leadership'); }}
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
                                updateLeadership(d, setResumeData, exp.id, 'bullets', updated);
                                highlight('leadership');
                              }}
                              placeholder="Describe an achievement or responsibility..."
                              className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/70 resize-none leading-relaxed"
                            />
                            <div className="flex flex-col gap-1 flex-shrink-0 mt-1">
                              <button
                                title="AI enhance this bullet"
                                disabled={enhancingBullet === `lead:${exp.id}:${bi}`}
                                onClick={async () => {
                                  if (!b.trim()) return;
                                  const key = `lead:${exp.id}:${bi}`;
                                  setEnhancingBullet(key);
                                  try {
                                    const res = await enhanceBullet(b, exp.title, exp.company);
                                    if (res.success && res.enhanced) {
                                      const updated = [...exp.bullets];
                                      updated[bi] = res.enhanced;
                                      updateLeadership(d, setResumeData, exp.id, 'bullets', updated);
                                      highlight('leadership');
                                    }
                                  } finally {
                                    setEnhancingBullet(null);
                                  }
                                }}
                                className="text-indigo-500/70 hover:text-indigo-400 disabled:opacity-40 disabled:cursor-wait transition-colors"
                              >
                                {enhancingBullet === `lead:${exp.id}:${bi}`
                                  ? <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin block" />
                                  : <Wand2 className="w-3.5 h-3.5" />}
                              </button>
                              {exp.bullets.length > 1 && (
                                <button
                                  onClick={() => { updateLeadership(d, setResumeData, exp.id, 'bullets', exp.bullets.filter((_, i) => i !== bi)); }}
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
      <ProcessingLoader
        title="Reorganizing your resume"
        subtitle="Sorting experiences chronologically and polishing formatting. Takes around 15 to 30 seconds."
        steps={[
          'Reading your edits',
          'Sorting experiences chronologically',
          'AI refining content and wording',
          'Updating your preview',
        ]}
        fileName={resumeFile?.name}
      />
    );
  }

  // ── STEP: preview ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-blue-950 flex flex-col">
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
          <span className="text-indigo-500 text-xs mt-2.5 flex-shrink-0 font-bold">•</span>
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

function updateLeadership(
  d: ResumeData,
  set: React.Dispatch<React.SetStateAction<ResumeData | null>>,
  id: string,
  field: keyof WorkEntry,
  value: any,
) {
  set({ ...d, leadership: d.leadership.map((e) => (e.id === id ? { ...e, [field]: value } : e)) });
}

function updateProject(
  d: ResumeData,
  set: React.Dispatch<React.SetStateAction<ResumeData | null>>,
  id: string,
  field: keyof WorkEntry,
  value: any,
) {
  set({ ...d, projects: d.projects.map((e) => (e.id === id ? { ...e, [field]: value } : e)) });
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
