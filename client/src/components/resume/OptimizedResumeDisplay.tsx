import React, { useState } from 'react';
import { FileText, Download, Copy, Check, Sparkles, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { OptimizationResult, ResumeChange, ResumeFormatting } from '../../types';

interface OptimizedResumeDisplayProps {
  result: OptimizationResult;
  onClose?: () => void;
}

// Default formatting settings matching user's resume style
const DEFAULT_FORMATTING: ResumeFormatting = {
  fontFamily: 'Times New Roman',
  fontSize: 11,
  headerStyle: 'bold-underline',
  bulletStyle: '●',
  lineSpacing: 1.0,
  margins: { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 } // 0.5 inch in mm
};

const OptimizedResumeDisplay: React.FC<OptimizedResumeDisplayProps> = ({ result, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showChanges, setShowChanges] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'text'>('pdf');

  // Use formatting from result or default
  const formatting = result.formatting || DEFAULT_FORMATTING;

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
      format: 'letter' // Standard US Letter size (215.9 x 279.4 mm)
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = formatting.margins?.left || 12.7;
    const marginRight = formatting.margins?.right || 12.7;
    const marginTop = formatting.margins?.top || 12.7;
    const marginBottom = formatting.margins?.bottom || 12.7;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let yPosition = marginTop + 8; // Added 8mm to push name down from top edge
    // Font size settings (matching user's resume)
    const nameFontSize = 18;
    const contactFontSize = 10;
    const sectionHeaderFontSize = 11;
    const bodyFontSize = 10;
    const lineHeight = 4.5;
    const bulletIndent = 5;
    
    // Use Times Roman (closest to Times New Roman in jsPDF)
    const fontFamily = 'times';
    
    // Pre-process the entire resume text to normalize bullet points
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
    
    // Split resume text into lines (after normalization)
    const resumeText = normalizeResumeText(result.optimizedResume);
    const lines = resumeText.split('\n');

    // Section header patterns
    const sectionHeaders = [
      'EDUCATION', 'TECHNICAL SKILLS', 'SKILLS', 'WORK EXPERIENCE', 'EXPERIENCE', 'TECHNICAL PROJECTS', 'HONORS & AWARDS',
      'PROJECTS', 'LEADERSHIP AND PROFESSIONAL DEVELOPMENT', 'LEADERSHIP','PROFESSIONAL AFFILIATIONS',
      'INTERESTS', 'CERTIFICATIONS', 'AWARDS', 'SUMMARY', 'OBJECTIVE',
      'PROFESSIONAL EXPERIENCE', 'PROFESSIONAL EXPERIENCES', 'LANGUAGES', 'VOLUNTEER', 'PUBLICATIONS'
    ];

    const isSectionHeader = (text: string): boolean => {
      const trimmed = text.trim().toUpperCase();
      return sectionHeaders.some(header => trimmed === header || trimmed.startsWith(header + ' '));
    };

    const isBulletPoint = (text: string): boolean => {
      const trimmed = text.trim();
      // Match various bullet characters including OCR artifacts
      return trimmed.startsWith('●') || 
             trimmed.startsWith('•') || 
             trimmed.startsWith('-') || 
             trimmed.startsWith('*') ||
             trimmed.startsWith('○') ||
             trimmed.startsWith('◦') ||
             trimmed.startsWith('▪') ||
             trimmed.startsWith('▫') ||
             trimmed.startsWith('■') ||
             trimmed.startsWith('□') ||
             trimmed.startsWith('►') ||
             trimmed.startsWith('▻') ||
             trimmed.startsWith('➢') ||
             trimmed.startsWith('➤') ||
             trimmed.startsWith('→') ||
             trimmed.startsWith('»') ||
             trimmed.startsWith('›') ||
             trimmed.startsWith('>') ||
             trimmed.startsWith('%') ||
             // OCR artifacts
             /^%[ÏIi]\s/.test(trimmed) ||
             /^¡\s/.test(trimmed) ||
             /^·\s/.test(trimmed) ||
             /^–\s/.test(trimmed) ||
             /^—\s/.test(trimmed);
    };

    // Normalize bullet characters to standard ● character
    const normalizeBulletLine = (text: string): string => {
      let normalized = text.trim();
      // Replace various bullet patterns with standard bullet
      const bulletPatterns = [
        /^%[ÏIi]\s+/,     // OCR artifact %Ï or %I
        /^¡\s+/,          // Inverted exclamation
        /^·\s+/,          // Middle dot
        /^•\s*/,          // Regular bullet
        /^○\s*/,          // Open circle
        /^◦\s*/,          // White bullet
        /^▪\s*/,          // Black small square
        /^▫\s*/,          // White small square
        /^■\s*/,          // Black square
        /^□\s*/,          // White square
        /^►\s*/,          // Black right pointer
        /^▻\s*/,          // White right pointer
        /^➢\s*/,          // Arrow
        /^➤\s*/,          // Arrow
        /^→\s*/,          // Arrow
        /^»\s*/,          // Right angle quote
        /^›\s*/,          // Single right angle quote
        /^>\s*/,          // Greater than
        /^-\s*/,          // Hyphen
        /^–\s*/,          // En dash
        /^—\s*/,          // Em dash
        /^\*\s*/,         // Asterisk
      ];
      
      for (const pattern of bulletPatterns) {
        if (pattern.test(normalized)) {
          normalized = normalized.replace(pattern, '• ');
          break;
        }
      }
      // Collapse excessive internal spacing introduced by OCR/AI
      const content = normalized.replace(/^•\s*/, '').replace(/\s+/g, ' ').trim();
      return content ? `• ${content}` : normalized;
    };

    const isContactLine = (text: string): boolean => {
      // Contact line typically contains email, phone, or multiple items separated by |
      const trimmed = text.trim();
      return (trimmed.includes('@') && trimmed.includes('|')) || 
             (trimmed.includes('|') && (trimmed.includes('linkedin') || trimmed.includes('github')));
    };

    const isJobTitleLine = (text: string): boolean => {
      // Job title lines are typically italic and have dates
      const trimmed = text.trim();
      const hasDate = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{4}/i.test(trimmed) ||
                      /\d{4}\s*[-–]\s*(Present|\d{4})/i.test(trimmed);
      const isNotBullet = !isBulletPoint(trimmed);
      const isNotHeader = !isSectionHeader(trimmed);
      return hasDate && isNotBullet && isNotHeader;
    };

    const isCompanyLine = (text: string): boolean => {
      // Company lines typically have location (City, State format)
      const trimmed = text.trim();
      const hasLocation = /,\s*[A-Z]{2}\b/.test(trimmed) || /\b(Remote|Houston|TX|IN|KY|DC|NC)\b/.test(trimmed);
      const hasDate = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}/i.test(trimmed) ||
                      /\d{4}\s*[-–]/.test(trimmed);
      const isNotBullet = !isBulletPoint(trimmed);
      const isNotHeader = !isSectionHeader(trimmed);
      return (hasLocation || hasDate) && isNotBullet && isNotHeader;
    };

    const isSkillCategoryLine = (text: string): boolean => {
      // Lines like "Programming Languages: Java, Python..."
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
      
      // Skip empty lines but add small spacing
      if (!trimmedLine) {
        yPosition += lineHeight * 0.3;
        return;
      }

      checkPageBreak();

      // FIRST LINE - Name (large, bold, centered)
      if (isFirstLine) {
        isFirstLine = false;
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(nameFontSize);
        const textWidth = doc.getTextWidth(trimmedLine);
        const xPosition = (pageWidth - textWidth) / 2;
        doc.text(trimmedLine, xPosition, yPosition);
        yPosition += lineHeight * 2.5; // Increased from 1.8 to 2.5 for more space after name
        lineIndex++;
        return;
      }

      // CONTACT LINE - centered, smaller font
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

      // SECTION HEADERS - bold, uppercase, with underline
      if (isSectionHeader(trimmedLine)) {
        yPosition += lineHeight * 0.5; // Space before header
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

      // SKILL CATEGORY LINES - Bold label, normal content
      if (isSkillCategoryLine(trimmedLine)) {
        const colonIndex = trimmedLine.indexOf(':');
        const label = trimmedLine.substring(0, colonIndex + 1);
        const content = trimmedLine.substring(colonIndex + 1).trim();
        
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(bodyFontSize);
        doc.text(label, marginLeft, yPosition);
        
        const labelWidth = doc.getTextWidth(label + ' ');
        doc.setFont(fontFamily, 'normal');
        
        // Word wrap the content
        const remainingWidth = contentWidth - labelWidth;
        const wrappedContent = doc.splitTextToSize(content, remainingWidth);
        
        if (wrappedContent.length > 0) {
          doc.text(wrappedContent[0], marginLeft + labelWidth, yPosition);
          yPosition += lineHeight;
          
          // Handle wrapped lines
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

      // COMPANY/INSTITUTION LINES - Bold name, location right-aligned
      if (isCompanyLine(trimmedLine) && !isJobTitleLine(trimmedLine)) {
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(bodyFontSize);
        
        // Try to split by common patterns (company + location/date)
        // Pattern: "Company Name" + "Location" or "Company, Location" + "Date"
        const parts = trimmedLine.split(/\s{2,}|\t/); // Split by multiple spaces or tab
        
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

      // JOB TITLE LINES - Italic title, dates right-aligned
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

      // BULLET POINTS - with proper indentation
      if (isBulletPoint(trimmedLine)) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(bodyFontSize);
        
        // Normalize bullet style to filled circle using the normalization function
        const normalizedLine = normalizeBulletLine(trimmedLine);
        
        const bulletChar = '•';
        const bulletContent = normalizedLine.replace(/^•\s*/, '').replace(/\s+/g, ' ').trim();
        
        // Draw bullet
        doc.text(bulletChar, marginLeft + bulletIndent, yPosition);
        
        // Word wrap bullet content
        const bulletContentIndent = bulletIndent + 5;
        const bulletContentWidth = contentWidth - bulletContentIndent;
        const wrappedLines = doc.splitTextToSize(bulletContent, bulletContentWidth);
        
        wrappedLines.forEach((wrappedLine: string, wrapIdx: number) => {
          checkPageBreak();
          if (wrapIdx === 0) {
            doc.text(wrappedLine, marginLeft + bulletContentIndent, yPosition);
          } else {
            // Hanging indent for continuation
            doc.text(wrappedLine, marginLeft + bulletContentIndent, yPosition);
          }
          yPosition += lineHeight;
        });
        
        lineIndex++;
        return;
      }

      // DEFAULT - Regular text
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
    doc.save(`optimized_resume_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadText = () => {
    const blob = new Blob([result.optimizedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimized_resume_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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

      {/* Tips */}
      {result.tips && result.tips.length > 0 && (
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <h4 className="font-semibold text-amber-800 mb-2">💡 Additional Tips:</h4>
          <ul className="space-y-1">
            {result.tips.map((tip: string, idx: number) => (
              <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                <span>•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resume Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Optimized Resume</h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
          >
            <Eye className="w-5 h-5" />
            Preview Resume
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Text
              </>
            )}
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium shadow-md"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>

          <button
            onClick={handleDownloadText}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Download Text
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
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                  {result.optimizedResume}
                </pre>
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

      {/* Close Button */}
      {onClose && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimizedResumeDisplay;
