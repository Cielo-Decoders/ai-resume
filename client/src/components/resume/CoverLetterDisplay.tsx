import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Download, Copy, Check, PenLine, RotateCcw,
  Briefcase, MessageCircle, Zap, Crown, ChevronDown, ChevronUp,
  Sparkles, X, ExternalLink
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CoverLetterResult } from '../../types';
import { generateCoverLetter } from '../../services/api';

interface CoverLetterDisplayProps {
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  company: string;
  jobUrl?: string;
}

const TONES = [
  {
    id: 'professional',
    label: 'Professional',
    description: 'Polished & corporate',
    icon: Briefcase,
    gradient: 'from-slate-600 to-slate-800',
    ring: 'ring-slate-400',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    accent: 'border-slate-300',
  },
  {
    id: 'conversational',
    label: 'Conversational',
    description: 'Warm & approachable',
    icon: MessageCircle,
    gradient: 'from-sky-500 to-cyan-600',
    ring: 'ring-sky-400',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    accent: 'border-sky-300',
  },
  {
    id: 'enthusiastic',
    label: 'Enthusiastic',
    description: 'Energetic & passionate',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    accent: 'border-amber-300',
  },
  {
    id: 'executive',
    label: 'Executive',
    description: 'Strategic & commanding',
    icon: Crown,
    gradient: 'from-violet-600 to-purple-800',
    ring: 'ring-violet-400',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    accent: 'border-violet-300',
  },
];

const CoverLetterDisplay: React.FC<CoverLetterDisplayProps> = ({
  resumeText,
  jobDescription,
  jobTitle,
  company,
  jobUrl,
}) => {
  const [selectedTone, setSelectedTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result?.coverLetter) {
      setEditedText(result.coverLetter);
    }
  }, [result]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const data = await generateCoverLetter(
        resumeText,
        jobDescription,
        jobTitle,
        company,
        selectedTone
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleCopy = async () => {
    const text = isEditing ? editedText : (result?.coverLetter || '');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const text = isEditing ? editedText : (result?.coverLetter || '');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 25.4;
    const marginRight = 25.4;
    const marginTop = 25.4;
    const contentWidth = pageWidth - marginLeft - marginRight;

    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(text, contentWidth);
    let y = marginTop;

    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - 25.4) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginLeft, y);
      y += 6;
    });

    const cleanCompany = company
      ? company.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').trim()
      : 'Cover_Letter';
    const datePart = new Date().toISOString().split('T')[0];
    doc.save(`Cover_Letter_${cleanCompany}_${datePart}.pdf`);
  };

  const handleDownloadTxt = () => {
    const text = isEditing ? editedText : (result?.coverLetter || '');
    const cleanCompany = company
      ? company.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').trim()
      : 'Cover_Letter';
    const datePart = new Date().toISOString().split('T')[0];
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${cleanCompany}_${datePart}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentTone = TONES.find(t => t.id === selectedTone) || TONES[0];
  const displayText = isEditing ? editedText : (result?.coverLetter || '');
  const wordCount = displayText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden" ref={sectionRef}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 flex items-center justify-between hover:brightness-105 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <FileText className="w-8 h-8" />
            <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300" />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold">AI Cover Letter Generator</h2>
            <p className="text-emerald-100 text-sm">
              {result ? 'Your cover letter is ready' : 'Craft the perfect cover letter in seconds'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              {wordCount} words
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Tone Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Choose your tone
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TONES.map((tone) => {
                const Icon = tone.icon;
                const isSelected = selectedTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    onClick={() => {
                      setSelectedTone(tone.id);
                      if (result) setResult(null);
                    }}
                    className={`relative group p-4 rounded-xl border-2 transition-all duration-200 text-left
                      ${isSelected
                        ? `${tone.accent} ${tone.bg} ring-2 ${tone.ring} shadow-md scale-[1.02]`
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                  >
                    <div className={`inline-flex p-2 rounded-lg mb-2 ${
                      isSelected
                        ? `bg-gradient-to-br ${tone.gradient} text-white shadow-sm`
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className={`font-semibold text-sm ${isSelected ? tone.text : 'text-gray-800'}`}>
                      {tone.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tone.description}
                    </div>
                    {isSelected && (
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br ${tone.gradient}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          {!result && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Crafting your cover letter...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Cover Letter
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Result */}
          {result && result.success && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${currentTone.bg} ${currentTone.text}`}>
                    {React.createElement(currentTone.icon, { className: 'w-3 h-3' })}
                    {currentTone.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {wordCount} words
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isEditing
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    {isEditing ? 'Editing' : 'Edit'}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Cover Letter Content — Paper Style */}
              <div
                className="relative bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => !isEditing && setShowPreview(true)}
              >
                {/* Decorative top bar */}
                <div className={`h-1 bg-gradient-to-r ${currentTone.gradient}`} />

                <div className="p-8 md:p-10">
                  {isEditing ? (
                    <textarea
                      ref={textareaRef}
                      value={editedText}
                      onChange={(e) => {
                        setEditedText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-gray-800 leading-relaxed font-serif text-base"
                      style={{ minHeight: '300px' }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-serif text-base">
                      {displayText}
                    </div>
                  )}
                </div>

                {/* Word count footer */}
                <div className="px-8 pb-4 flex items-center justify-between text-xs text-gray-400">
                  <span>{wordCount} words · ~{Math.ceil(wordCount / 200)} min read</span>
                  {!isEditing && <span className="text-gray-400">Click to preview full page</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Full Preview
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors font-medium text-sm shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200"
                >
                  <Download className="w-4 h-4" />
                  Download TXT
                </button>
                {jobUrl && (
                  <a
                    href={jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Apply Now
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Page Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                Cover Letter Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white shadow-lg rounded-lg mx-auto max-w-2xl"
                style={{
                  padding: '60px 50px',
                  minHeight: '700px',
                  fontFamily: '"Times New Roman", Times, serif',
                }}
              >
                <div className="whitespace-pre-wrap text-gray-800 leading-[1.8] text-base">
                  {displayText}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={() => {
                  handleDownloadPDF();
                  setShowPreview(false);
                }}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
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

export default CoverLetterDisplay;
