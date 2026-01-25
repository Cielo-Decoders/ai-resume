import React, { useState } from 'react';
import { FileText, Download, Check, Sparkles, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { OptimizationResult, ResumeChange, ResumeFormatting } from '../../types';

interface OptimizedResumeDisplayProps {
  result: OptimizationResult;
  originalResume?: string;
  onClose?: () => void;
}

// Default formatting settings matching user's resume style
const DEFAULT_FORMATTING: ResumeFormatting = {
  fontFamily: 'Times New Roman',
  fontSize: 11,
  headerStyle: 'bold-underline',
  bulletStyle: '●',
  lineSpacing: 1.0,
  margins: { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 }
};

const OptimizedResumeDisplay: React.FC<OptimizedResumeDisplayProps> = ({ result, originalResume, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showChanges, setShowChanges] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'text'>('pdf');

  const formatting = result.formatting || DEFAULT_FORMATTING;
  const displayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.optimizedResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const generatePDF = (): jsPDF => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = formatting.margins?.left || 12.7;
    const marginRight = formatting.margins?.right || 12.7;
    const marginTop = formatting.margins?.top || 12.7;
    const marginBottom = formatting.margins?.bottom || 12.7;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let yPosition = marginTop + 8;

    const nameFontSize = 18;
    const contactFontSize = 10;
    const sectionHeaderFontSize = 11;
    const bodyFontSize = 10;
    const lineHeight = 4.5;
    const bulletIndent = 5;
    const fontFamily = 'times';

    const normalizeResumeText = (text: string): string => {
      const bulletPatterns = [
        { pattern: /^(\s*)%[^\s]\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)%[ÏIi]\s+/gm, replacement: '$1• ' },
        { pattern: /^(\s*)¡\s+/gm, replacement: '$1• ' },
        { pattern: /^(\s*)·\s+/gm, replacement: '$1• ' },
        { pattern: /^(\s*)•\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)○\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)◦\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)▪\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)▫\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)■\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)□\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)►\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)▻\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)»\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)›\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)–\s*/gm, replacement: '$1• ' },
        { pattern: /^(\s*)—\s*/gm, replacement: '$1• ' },
      ];
      let normalized = text;
      for (const { pattern, replacement } of bulletPatterns) {
        normalized = normalized.replace(pattern, replacement);
      }
      return normalized;
    };

    const resumeText = normalizeResumeText(result.optimizedResume);
    const lines = resumeText.split('\n');

    const sectionHeaders = [
      'EDUCATION', 'TECHNICAL SKILLS', 'SKILLS', 'WORK EXPERIENCE', 'EXPERIENCE', 'TECHNICAL PROJECTS', 'HONORS & AWARDS',
      'PROJECTS', 'LEADERSHIP AND PROFESSIONAL DEVELOPMENT', 'LEADERSHIP', 'PROFESSIONAL AFFILIATIONS',
      'INTERESTS', 'CERTIFICATIONS', 'AWARDS', 'SUMMARY', 'OBJECTIVE',
      'PROFESSIONAL EXPERIENCE', 'PROFESSIONAL EXPERIENCES', 'LANGUAGES', 'VOLUNTEER', 'PUBLICATIONS'
    ];

    const isSectionHeader = (text: string): boolean => {
      const trimmed = text.trim().toUpperCase();
      return sectionHeaders.some(header => trimmed === header || trimmed.startsWith(header + ' '));
    };

    const isBulletPoint = (text: string): boolean => {
      const trimmed = text.trim();
      return trimmed.startsWith('●') || trimmed.startsWith('•') || trimmed.startsWith('-') ||
             trimmed.startsWith('*') || trimmed.startsWith('○') || trimmed.startsWith('◦') ||
             trimmed.startsWith('▪') || trimmed.startsWith('▫') || trimmed.startsWith('■') ||
             trimmed.startsWith('□') || trimmed.startsWith('►') || trimmed.startsWith('▻') ||
             trimmed.startsWith('➢') || trimmed.startsWith('➤') || trimmed.startsWith('→') ||
             trimmed.startsWith('»') || trimmed.startsWith('›') || trimmed.startsWith('>') ||
             trimmed.startsWith('%') || /^%[ÏIi]\s/.test(trimmed) || /^¡\s/.test(trimmed) ||
             /^·\s/.test(trimmed) || /^–\s/.test(trimmed) || /^—\s/.test(trimmed);
    };

    const normalizeBulletLine = (text: string): string => {
      let normalized = text.trim();
      const bulletPatterns = [
        /^%[ÏIi]\s+/, /^¡\s+/, /^·\s+/, /^•\s*/, /^○\s*/, /^◦\s*/, /^▪\s*/, /^▫\s*/,
        /^■\s*/, /^□\s*/, /^►\s*/, /^▻\s*/, /^➢\s*/, /^➤\s*/, /^→\s*/, /^»\s*/,
        /^›\s*/, /^>\s*/, /^-\s*/, /^–\s*/, /^—\s*/, /^\*\s*/,
      ];
      for (const pattern of bulletPatterns) {
        if (pattern.test(normalized)) {
          normalized = normalized.replace(pattern, '• ');
          break;
        }
      }
      const content = normalized.replace(/^•\s*/, '').replace(/\s+/g, ' ').trim();
      return content ? `• ${content}` : normalized;
    };

    const isContactLine = (text: string): boolean => {
      const trimmed = text.trim();
      return (trimmed.includes('@') && trimmed.includes('|')) ||
             (trimmed.includes('|') && (trimmed.includes('linkedin') || trimmed.includes('github')));
    };

    const isJobTitleLine = (text: string): boolean => {
      const trimmed = text.trim();
      const hasDate = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{4}/i.test(trimmed) ||
                      /\d{4}\s*[-–]\s*(Present|\d{4})/i.test(trimmed);
      return hasDate && !isBulletPoint(trimmed) && !isSectionHeader(trimmed);
    };

    const isCompanyLine = (text: string): boolean => {
      const trimmed = text.trim();
      const hasLocation = /,\s*[A-Z]{2}\b/.test(trimmed) || /\b(Remote|Houston|TX|IN|KY|DC|NC)\b/.test(trimmed);
      const hasDate = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}/i.test(trimmed) ||
                      /\d{4}\s*[-–]/.test(trimmed);
      return (hasLocation || hasDate) && !isBulletPoint(trimmed) && !isSectionHeader(trimmed);
    };

    const isSkillCategoryLine = (text: string): boolean => {
      const trimmed = text.trim();
      return /^[A-Za-z\s/]+:/.test(trimmed) && !isSectionHeader(trimmed);
    };

    const drawUnderline = (y: number) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
    };

    const checkPageBreak = (neededSpace: number = lineHeight * 2) => {
      if (yPosition + neededSpace > pageHeight - marginBottom) {
        doc.addPage();
        yPosition = marginTop;
        return true;
      }
      return false;
    };

    let lineIndex = 0;
    let isFirstLine = true;

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        yPosition += lineHeight * 0.3;
        return;
      }

      checkPageBreak();

      if (isFirstLine) {
        isFirstLine = false;
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(nameFontSize);
        const textWidth = doc.getTextWidth(trimmedLine);
        const xPosition = (pageWidth - textWidth) / 2;
        doc.text(trimmedLine, xPosition, yPosition);
        yPosition += lineHeight * 2.5;
        lineIndex++;
        return;
      }

      if (lineIndex === 1 && isContactLine(trimmedLine)) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(contactFontSize);
        const textWidth = doc.getTextWidth(trimmedLine);
        const xPosition = (pageWidth - textWidth) / 2;
        doc.text(trimmedLine, xPosition, yPosition);
        yPosition += lineHeight * 1.2;
        lineIndex++;
        return;
      }

      if (isSectionHeader(trimmedLine)) {
        yPosition += lineHeight * 0.5;
        checkPageBreak();
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(sectionHeaderFontSize);
        doc.text(trimmedLine.toUpperCase(), marginLeft, yPosition);
        yPosition += lineHeight * 0.3;
        drawUnderline(yPosition);
        yPosition += lineHeight * 0.8;
        lineIndex++;
        return;
      }

      if (isSkillCategoryLine(trimmedLine)) {
        const colonIndex = trimmedLine.indexOf(':');
        const label = trimmedLine.substring(0, colonIndex + 1);
        const content = trimmedLine.substring(colonIndex + 1).trim();
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(bodyFontSize);
        doc.text(label, marginLeft, yPosition);
        const labelWidth = doc.getTextWidth(label + ' ');
        doc.setFont(fontFamily, 'normal');
        const remainingWidth = contentWidth - labelWidth;
        const wrappedContent = doc.splitTextToSize(content, remainingWidth);
        if (wrappedContent.length > 0) {
          doc.text(wrappedContent[0], marginLeft + labelWidth, yPosition);
          yPosition += lineHeight;
          for (let i = 1; i < wrappedContent.length; i++) {
            checkPageBreak();
            doc.text(wrappedContent[i], marginLeft, yPosition);
            yPosition += lineHeight;
          }
        } else {
          yPosition += lineHeight;
        }
        lineIndex++;
        return;
      }

      if (isCompanyLine(trimmedLine) && !isJobTitleLine(trimmedLine)) {
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(bodyFontSize);
        const parts = trimmedLine.split(/\s{2,}|\t/);
        if (parts.length >= 2) {
          const leftPart = parts[0];
          const rightPart = parts.slice(1).join(' ').trim();
          doc.text(leftPart, marginLeft, yPosition);
          const rightWidth = doc.getTextWidth(rightPart);
          doc.text(rightPart, pageWidth - marginRight - rightWidth, yPosition);
        } else {
          doc.text(trimmedLine, marginLeft, yPosition);
        }
        yPosition += lineHeight;
        lineIndex++;
        return;
      }

      if (isJobTitleLine(trimmedLine)) {
        doc.setFont(fontFamily, 'italic');
        doc.setFontSize(bodyFontSize);
        const parts = trimmedLine.split(/\s{2,}|\t/);
        if (parts.length >= 2) {
          const leftPart = parts[0];
          const rightPart = parts.slice(1).join(' ').trim();
          doc.text(leftPart, marginLeft, yPosition);
          doc.setFont(fontFamily, 'normal');
          const rightWidth = doc.getTextWidth(rightPart);
          doc.text(rightPart, pageWidth - marginRight - rightWidth, yPosition);
        } else {
          doc.text(trimmedLine, marginLeft, yPosition);
        }
        yPosition += lineHeight;
        lineIndex++;
        return;
      }

      if (isBulletPoint(trimmedLine)) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(bodyFontSize);
        const normalizedLine = normalizeBulletLine(trimmedLine);
        const bulletChar = '•';
        const bulletContent = normalizedLine.replace(/^•\s*/, '').replace(/\s+/g, ' ').trim();
        doc.text(bulletChar, marginLeft + bulletIndent, yPosition);
        const bulletContentIndent = bulletIndent + 5;
        const bulletContentWidth = contentWidth - bulletContentIndent;
        const wrappedLines = doc.splitTextToSize(bulletContent, bulletContentWidth);
        wrappedLines.forEach((wrappedLine: string, wrapIdx: number) => {
          checkPageBreak();
          doc.text(wrappedLine, marginLeft + bulletContentIndent, yPosition);
          yPosition += lineHeight;
        });
        lineIndex++;
        return;
      }

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(bodyFontSize);
      const wrappedLines = doc.splitTextToSize(trimmedLine, contentWidth);
      wrappedLines.forEach((wrappedLine: string) => {
        checkPageBreak();
        doc.text(wrappedLine, marginLeft, yPosition);
        yPosition += lineHeight;
      });
      lineIndex++;
    });

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();

    // Extract the user's name from the first line of the optimized resume
    const firstLine = result.optimizedResume.split('\n')[0]?.trim() || 'Resume';
    // Clean the name: replace spaces with underscores, remove special characters
    const cleanName = firstLine
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();

    const fileName = `${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Enhanced function to highlight word-level differences
  const highlightWordDifferences = (original: string, optimized: string): JSX.Element => {
    const elements: JSX.Element[] = [];

    // Collect all keywords that were added during optimization
    const optimizationKeywords = new Set<string>();
    if (result.changes && result.changes.length > 0) {
      result.changes.forEach((change: ResumeChange) => {
        if (change.keywordsAdded && change.keywordsAdded.length > 0) {
          change.keywordsAdded.forEach((keyword: string) => {
            keyword.split(/\s+/).forEach(word => {
              const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
              if (cleanWord && cleanWord.length > 1) {
                optimizationKeywords.add(cleanWord);
              }
            });
          });
        }
      });
    }

    // Normalize text by removing all special/hidden characters and extra spaces
    const normalizeText = (text: string): string => {
      return text
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
        .replace(/[\u00A0]/g, ' ') // Replace non-breaking spaces with regular spaces
        .replace(/[\u202F\u2007\u2060]/g, ' ') // Replace other special spaces
        .replace(/[\u2028\u2029]/g, ' ') // Replace line/paragraph separators
        .replace(/[\t\r]+/g, ' ') // Replace tabs and carriage returns with spaces
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    };

    // Clean a word for comparison - remove ALL non-alphanumeric characters
    const cleanWordForComparison = (word: string): string => {
      return word
        .replace(/[\u200B-\u200D\uFEFF\u00A0\u202F\u2007\u2060\u2028\u2029]/g, '') // Remove special spaces
        .replace(/[^\w]/g, '') // Remove all non-word characters
        .toLowerCase()
        .trim();
    };

    // Normalize the original text first
    const normalizedOriginal = normalizeText(original);

    // Create the full original text as lowercase for substring matching
    const originalTextLower = normalizedOriginal.toLowerCase();

    // Create a map of original lines for comparison
    const originalLinesArray = original.split('\n').map(line => normalizeText(line).toLowerCase());

    // Create a set of all words from the original resume
    const originalWordsSet = new Set<string>();
    normalizedOriginal.split(/\s+/).forEach(word => {
      const cleanWord = cleanWordForComparison(word);
      if (cleanWord && cleanWord.length > 0) {
        originalWordsSet.add(cleanWord);
        // Also add without hyphens
        originalWordsSet.add(cleanWord.replace(/-/g, ''));
        // Also add each part of hyphenated words
        cleanWord.split(/[-]/).forEach(part => {
          if (part && part.length > 1) {
            originalWordsSet.add(part);
          }
        });
      }
    });

    // Section header patterns
    const sectionHeaders = [
      'EDUCATION', 'TECHNICAL SKILLS', 'SKILLS', 'WORK EXPERIENCE', 'EXPERIENCE',
      'TECHNICAL PROJECTS', 'HONORS & AWARDS', 'PROJECTS',
      'LEADERSHIP AND PROFESSIONAL DEVELOPMENT', 'LEADERSHIP', 'PROFESSIONAL AFFILIATIONS',
      'INTERESTS', 'CERTIFICATIONS', 'AWARDS', 'SUMMARY', 'OBJECTIVE',
      'PROFESSIONAL EXPERIENCE', 'PROFESSIONAL EXPERIENCES', 'LANGUAGES',
      'VOLUNTEER', 'PUBLICATIONS', 'CONTACT', 'PROFILE', 'ABOUT'
    ];

    const isSectionHeaderCheck = (text: string): boolean => {
      const trimmed = normalizeText(text).toUpperCase();
      return sectionHeaders.some(header =>
        trimmed === header ||
        trimmed.startsWith(header + ' ') ||
        trimmed.endsWith(' ' + header)
      );
    };

    // Only exclude basic filler words and common resume structural words
    const stopWords = new Set([
      // Articles, conjunctions, prepositions
      'the', 'a', 'an', 'and', 'or', 'but', 'nor', 'so', 'yet', 'for',
      'in', 'on', 'at', 'to', 'of', 'with', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'between',
      'under', 'over', 'out', 'up', 'down', 'off', 'about', 'against',
      'within', 'without', 'along', 'around', 'among', 'across', 'behind',
      'beyond', 'near', 'upon', 'per',
      // Pronouns
      'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours',
      'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
      'it', 'its', 'they', 'them', 'their', 'theirs',
      'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
      // Common verbs
      'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
      // Other common words
      'not', 'no', 'yes', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'other', 'some', 'such', 'only', 'own', 'same', 'than',
      'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
      'once', 'if', 'when', 'where', 'why', 'how', 'any', 'many', 'much',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
      // Months
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
      'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
      // Common resume section/structural words
      'expected', 'present', 'current', 'relevant', 'courses', 'course',
      'technologies', 'technology', 'tools', 'tool', 'prototyping',
      'skills', 'skill', 'experience', 'experiences', 'education',
      'projects', 'project', 'work', 'professional', 'summary', 'objective',
      'certifications', 'certification', 'awards', 'award', 'honors', 'honor',
      'languages', 'language', 'interests', 'interest', 'activities', 'activity',
      'leadership', 'volunteer', 'publications', 'publication', 'references',
      // Common email/url parts
      'gmail', 'com', 'edu', 'org', 'net', 'linkedin', 'github', 'https', 'http', 'www',
      // Common location words
      'remote', 'city', 'state', 'street', 'avenue', 'road', 'drive',
      // Common degree words
      'bachelor', 'master', 'doctor', 'associate', 'degree', 'science', 'arts',
      'engineering', 'business', 'administration', 'computer', 'information',
      // Common job title words
      'engineer', 'developer', 'analyst', 'manager', 'director', 'lead',
      'senior', 'junior', 'intern', 'internship', 'associate', 'assistant',
      'specialist', 'coordinator', 'consultant', 'architect', 'designer',
      // Common tech words that appear in most resumes
      'software', 'development', 'programming', 'application', 'applications',
      'system', 'systems', 'data', 'database', 'web', 'mobile', 'cloud',
      'full', 'stack', 'front', 'end', 'back', 'frontend', 'backend',
      // Common action words
      'using', 'used', 'based', 'including', 'included', 'developed', 'created',
      'designed', 'implemented', 'built', 'managed', 'led', 'worked',
      'collaborated', 'contributed', 'improved', 'increased', 'decreased',
      'achieved', 'completed', 'delivered', 'established', 'maintained'
    ]);

    // Function to check if a word exists in the original text
    const wordExistsInOriginal = (word: string): boolean => {
      const cleanWord = cleanWordForComparison(word);
      if (!cleanWord || cleanWord.length <= 1) return true; // Skip short words

      // Check in word set
      if (originalWordsSet.has(cleanWord)) return true;
      if (originalWordsSet.has(cleanWord.replace(/-/g, ''))) return true;

      // Also check as substring in original text (handles cases with special characters)
      if (originalTextLower.includes(cleanWord)) return true;

      return false;
    };

    // Function to check if a line has been restructured from original
    const isLineRestructured = (optimizedLine: string): boolean => {
      const normalizedOptimized = normalizeText(optimizedLine).toLowerCase();

      if (originalLinesArray.includes(normalizedOptimized)) {
        return false;
      }

      const optimizedWords = normalizedOptimized.split(/\s+/).filter(w => w.length > 2);

      for (const origLine of originalLinesArray) {
        const origWords = origLine.split(/\s+/).filter(w => w.length > 2);
        let matchCount = 0;
        for (const word of optimizedWords) {
          const cleanWord = cleanWordForComparison(word);
          if (origWords.some(ow => cleanWordForComparison(ow) === cleanWord)) {
            matchCount++;
          }
        }
        const matchRatio = matchCount / Math.max(optimizedWords.length, 1);
        if (matchRatio > 0.5 && normalizedOptimized !== origLine) {
          return true;
        }
      }

      return false;
    };

    // Function to get words that are new in this specific line context
    const getNewWordsInLine = (optimizedLine: string): Set<string> => {
      const newWords = new Set<string>();
      const normalizedOptimized = normalizeText(optimizedLine).toLowerCase();
      const optimizedWords = normalizedOptimized.split(/\s+/);

      let bestMatchLine = '';
      let bestMatchScore = 0;

      for (const origLine of originalLinesArray) {
        const origWords = origLine.split(/\s+/);
        let matchCount = 0;
        for (const word of optimizedWords) {
          const cleanWord = cleanWordForComparison(word);
          if (origWords.some(ow => cleanWordForComparison(ow) === cleanWord)) {
            matchCount++;
          }
        }
        if (matchCount > bestMatchScore) {
          bestMatchScore = matchCount;
          bestMatchLine = origLine;
        }
      }

      if (bestMatchLine && bestMatchScore > 0) {
        const origWordsSet = new Set(bestMatchLine.split(/\s+/).map(w => cleanWordForComparison(w)));
        for (const word of optimizedWords) {
          const cleanWord = cleanWordForComparison(word);
          if (cleanWord && cleanWord.length > 1 && !origWordsSet.has(cleanWord)) {
            newWords.add(cleanWord);
          }
        }
      }

      return newWords;
    };

    const optimizedLinesArray = optimized.split('\n');

    optimizedLinesArray.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        elements.push(<br key={`line-${lineIndex}`} />);
        return;
      }

      if (isSectionHeaderCheck(trimmedLine)) {
        elements.push(
          <div key={`line-${lineIndex}`} className="font-bold">
            {line}
          </div>
        );
        return;
      }

      const lineIsRestructured = isLineRestructured(trimmedLine);
      const newWordsInThisLine = lineIsRestructured ? getNewWordsInLine(trimmedLine) : new Set<string>();

      const tokens = line.split(/(\s+)/);

      const highlightedTokens = tokens.map((token, tokenIndex) => {
        if (/^\s+$/.test(token)) {
          return <span key={`token-${lineIndex}-${tokenIndex}`}>{token}</span>;
        }

        const cleanWord = cleanWordForComparison(token);

        if (!cleanWord || cleanWord.length <= 1) {
          return <span key={`token-${lineIndex}-${tokenIndex}`}>{token}</span>;
        }

        if (stopWords.has(cleanWord)) {
          return <span key={`token-${lineIndex}-${tokenIndex}`}>{token}</span>;
        }

        // Check if this word exists in original resume
        const existsInOriginal = wordExistsInOriginal(token);

        // Only highlight if word doesn't exist in original AND is new in restructured line
        const isNewInRestructuredLine = lineIsRestructured && newWordsInThisLine.has(cleanWord);
        const shouldHighlight = !existsInOriginal && (isNewInRestructuredLine || !lineIsRestructured);

        if (shouldHighlight) {
          return (
            <strong key={`token-${lineIndex}-${tokenIndex}`} className="text-indigo-900 bg-yellow-100 px-0.5 rounded">
              {token}
            </strong>
          );
        }

        return <span key={`token-${lineIndex}-${tokenIndex}`}>{token}</span>;
      });

      elements.push(
        <div key={`line-${lineIndex}`}>
          {highlightedTokens}
        </div>
      );
    });

    return <div className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">{elements}</div>;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden" ref={displayRef}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Optimized Resume Generated!</h2>
              <p className="text-indigo-100">Your ATS-optimized resume is ready</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-2xl ${getScoreColor(result.atsScore)}`}>
            {result.atsScore}%
            <span className="text-sm font-normal ml-1">ATS Score</span>
          </div>
        </div>
      </div>

      {/* Changes Summary */}
      {result.changes && result.changes.length > 0 && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => setShowChanges(!showChanges)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Changes Made ({result.changes.length})
            </h3>
            {showChanges ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showChanges && (
            <div className="px-4 pb-4 space-y-3">
              {result.changes.map((change: ResumeChange, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm font-medium">
                      {change.section}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{change.description}</p>
                  {change.keywordsAdded && change.keywordsAdded.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {change.keywordsAdded.map((kw: string, kidx: number) => (
                        <span
                          key={kidx}
                          className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs"
                        >
                          +{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resume Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Optimized Resume</h3>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
          >
            <Eye className="w-5 h-5" />
            Preview Resume
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium shadow-md"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Resume Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white shadow-lg rounded-lg p-8 max-w-3xl mx-auto min-h-[600px]">
                {originalResume ? (
                  <div className="text-sm text-gray-800 font-sans leading-relaxed">
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-800">
                      <strong>Legend:</strong> <span className="font-bold text-indigo-900 bg-yellow-100 px-1 rounded">Bold/highlighted text</span> indicates AI-optimized content added or modified from your original resume.
                    </div>
                    {highlightWordDifferences(originalResume, result.optimizedResume)}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                    {result.optimizedResume}
                  </pre>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadPDF();
                  setShowPreview(false);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedResumeDisplay;

