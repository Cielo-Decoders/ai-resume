import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, FileText, Mail, ChevronDown, Eye, Download, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import TabNavigation from '../components/tabs/TabNavigation';
import ResumeUpload from '../components/resume/ResumeUpload';
import KeywordAnalysis from '../components/resume/KeywordAnalysis';
import OptimizedResumeDisplay, { OptimizedResumeDisplayHandle } from '../components/resume/OptimizedResumeDisplay';
import CoverLetterDisplay from '../components/resume/CoverLetterDisplay';
import MatchScoreCard from '../components/resume/MatchScoreCard';
import {Application, JobData, KeywordAnalysisResult, ActionableKeyword, OptimizationResult, RedFlagResult, CoverLetterResult } from '../types/index';
import {extractJobDataFromText, extractTextFromResume, analyzeKeywords, optimizeResume, scanJobRedFlags} from '../services/api';
import JobDescriptionInput from '../components/jobs/JobDescriptionInput';
import JobListings from '../components/jobs/JobListings';
import RedFlagScanner from '../components/jobs/RedFlagScanner';
import Footer from '../components/Footer';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

const MAX_RESUME_PAGES = 2;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

async function validateResumePdf(file: File): Promise<string | null> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    if (pdf.numPages > MAX_RESUME_PAGES) {
      return `Your resume has ${pdf.numPages} pages. Please upload a resume with ${MAX_RESUME_PAGES} pages or fewer.`;
    }
  } catch {
    return 'Could not read the PDF. Please ensure it is a valid, text-based PDF.';
  }
  return null;
}

export default function ATSAnalyzer() {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = (pathname: string) => {
    if (pathname === '/app/analysis') return 'analyze';
    if (pathname === '/app/coverletter') return 'cover-letter';
    return 'jobs';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    const path =
      tab === 'analyze' ? '/app/analysis' :
      tab === 'cover-letter' ? '/app/coverletter' :
      '/app/jobs';
    navigate(path, { replace: true });
  };

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode] = useState<'paste'>('paste');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [applications] = useState<Application[]>([]);
  const [baseResume, setBaseResume] = useState<File | null>(null);
  const [scrapingStatus, setScrapingStatus] = useState('');
  const [keywordResults, setKeywordResults] = useState<KeywordAnalysisResult | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // New state for optimization
  const [resumeText, setResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [optimizedResumeText, setOptimizedResumeText] = useState('');
  const [, setSelectedKeywords] = useState<ActionableKeyword[]>([]);
  const [clearKeywordSelections, setClearKeywordSelections] = useState(false);
  const [redFlagResult, setRedFlagResult] = useState<RedFlagResult | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<CoverLetterResult | null>(null);
  const [coverLetterEditedText, setCoverLetterEditedText] = useState('');
  const [coverLetterTone, setCoverLetterTone] = useState('professional');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isValidatingFile, setIsValidatingFile] = useState(false);

  // Ref for scrolling to results section
  const resultsRef = React.useRef<HTMLDivElement>(null);
  // Ref for OptimizedResumeDisplay actions (preview, download)
  const optimizedResumeRef = useRef<OptimizedResumeDisplayHandle>(null);

  // Scroll to results when analysis is complete
  React.useEffect(() => {
    if (analysisComplete && resultsRef.current) {
      // Small delay to ensure the DOM has rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [analysisComplete]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so the same file can be re-selected after fixing
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file.');
      return;
    }
    setUploadError(null);
    setIsValidatingFile(true);
    validateResumePdf(file).then((error) => {
      setIsValidatingFile(false);
      if (error) {
        setUploadError(error);
        return;
      }
      setResumeFile(file);
      if (!baseResume) setBaseResume(file);
    });
  };

  const analyzeResume = async () => {
  if (inputMode === 'paste' && !jobDescription) {
    alert('Please paste the job description');
    return;
  }

  if (!resumeFile) {
    alert('Please upload your resume');
    return;
  }

  setIsAnalyzing(true);
  setKeywordResults(null);
  setAnalysisComplete(false);
  setOptimizationResult(null); // Reset optimization result
  setOptimizedResumeText(''); // Reset optimized resume text
  setRedFlagResult(null); // Reset red flag result
  setCoverLetterResult(null); // Reset cover letter
  setCoverLetterEditedText('');
  setCoverLetterTone('professional');

  try {
    let jobData: JobData;
    let extractedResumeText: string = '';

    // Step 1: Extract job data from description + run red flag scan in parallel
    if (inputMode === 'paste') {
      setScrapingStatus('Extracting job details with AI...');
      try {
        const [jobDataResult, redFlagScanResult] = await Promise.all([
          extractJobDataFromText(jobDescription),
          scanJobRedFlags(jobDescription).catch(() => null),
        ]);
        jobData = jobDataResult;
        // Store job title for optimization
        setJobTitle(jobData.title || '');
        // Store company name for optimization
        setCompany(jobData.company || '');
        // Store red flag results
        if (redFlagScanResult) {
          setRedFlagResult(redFlagScanResult);
        }
      } catch (error) {
        alert('Failed to extract job data. Please try again.');
        setScrapingStatus('');
        setIsAnalyzing(false);
        return;
      }
    } else {
      setScrapingStatus('');
      setIsAnalyzing(false);
      return;
    }

    // Step 2: Extract text from resume PDF
    try {
      setScrapingStatus('Extracting text from your resume...');
      const aiResults = await extractTextFromResume(resumeFile!);

      // Use fullText if available, otherwise fall back to text
      extractedResumeText = aiResults.fullText || aiResults.text || '';

      if (!extractedResumeText || extractedResumeText.length < 50) {
        throw new Error('Could not extract meaningful text from the resume');
      }
      
      // Store FULL resume text for optimization
      setResumeText(extractedResumeText);
    } catch (error: any) {
      if (error.message && (error.message.includes('PDF') || error.message.includes('extract'))) {
        setScrapingStatus('');
        setIsAnalyzing(false);
        alert(`PDF Extraction Error\n\n${error.message}\n\nPlease ensure:\n1. Your resume is a text-based PDF (not a scanned image)\n2. The PDF file is not corrupted\n3. The file has readable text content\n\nTip: Try opening your PDF and copying some text. If you can't copy text, it's likely an image-based PDF that requires OCR.`);
        return;
      }
      setScrapingStatus('');
      setIsAnalyzing(false);
      alert(`Resume extraction failed: ${error.message}`);
      return;
    }

    // Step 3: Analyze keywords - compare resume against job description
    try {
      setScrapingStatus('Analyzing keywords and matching skills...');
      const keywordAnalysis = await analyzeKeywords(extractedResumeText, jobData);
      setKeywordResults(keywordAnalysis);
      setAnalysisComplete(true);
    } catch (error: any) {
      alert(`Keyword analysis failed: ${error.message}`);
    }

    setScrapingStatus('');
    setIsAnalyzing(false);

  } catch (error) {
    alert('Failed to retrieve job description. Please try again.');
    setScrapingStatus('');
    setIsAnalyzing(false);
  }
};

  // Handle resume optimization with selected keywords
  const handleOptimizeResume = async (keywords: ActionableKeyword[]) => {
    if (!resumeText || resumeText.length < 50) {
      alert('Resume text not available. Please analyze your resume first by clicking the "Analyze" button.');
      return;
    }
    
    if (!jobDescription) {
      alert('Job description not available. Please provide a job description.');
      return;
    }
    
    if (keywords.length === 0) {
      alert('Please select at least one keyword for optimization.');
      return;
    }

    setIsOptimizing(true);
    setOptimizationResult(null);
    setScrapingStatus('Generating your optimized resume with AI...');
    setClearKeywordSelections(false); // Reset the clear flag

    try {
      const result = await optimizeResume(
        resumeText,
        jobDescription,
        keywords,
        jobTitle
      );

      if (result.success) {
        setOptimizationResult(result);
        setOptimizedResumeText(result.optimizedResume);
        // Trigger keyword selections to be cleared
        setClearKeywordSelections(true);
      } else {
        alert(`Optimization failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Failed to optimize resume: ${error.message}`);
    } finally {
      setIsOptimizing(false);
      setScrapingStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Full-page Loading Overlay */}
      {(isAnalyzing || isOptimizing) && scrapingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-fadeIn">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-200 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
                <Upload className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800">
                  {isOptimizing ? 'Optimizing ...' : 'Analyzing ...'}
                </h3>
                <p className="text-gray-600 font-medium">{scrapingStatus}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full animate-progress"></div>
              </div>

              <p className="text-sm text-gray-500">This may take a few moments...</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-0 w-full justify-center md:justify-start">
              <img
                src="/Logo3.png"
                alt="CareerDev Logo"
                className="h-12 sm:h-16 lg:h-20 w-auto object-contain"
              />
              <div className="flex flex-col mt-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
                  CareerDev AI
                </h1>
                <p className="text-gray-600 text-sm font-medium tracking-wide text-center">
                  Your AI-Powered Career Assistant
                </p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-base sm:text-lg mb-4">
              AI-Powered Resume Optimization for Career Success
            </p>
            {baseResume && (
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4" />
                Base Resume: {baseResume.name}
              </div>
            )}
          </div>
        </div>
        <TabNavigation
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          applicationsCount={applications.length}
        />
        {activeTab === 'jobs' && (
          <JobListings
            onUseDescription={(job) => {
              // Strip HTML tags to get plain text description
              const plainText = job.description.replace(/<[^>]*>/g, '\n').replace(/\n{2,}/g, '\n').trim();
              setJobDescription(plainText);
              setJobUrl(job.url || '');
              setCompany(job.company_name || '');
              setJobTitle(job.title || '');
              handleSetActiveTab('analyze');
            }}
          />
        )}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
              {/* Desktop: Side by side headings, Mobile: Hidden (headings with each section) */}
              <div className="hidden md:grid md:grid-cols-2 gap-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-indigo-600" />
                  Upload & Analyze
                </h2>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 pl-8">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  Job Description
                </h2>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6">
                {/* Resume Upload Section */}
                <div className="space-y-4">
                  {/* Mobile: Show heading with section */}
                  <h2 className="md:hidden text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    Upload & Analyze
                  </h2>
                  <ResumeUpload
                    resumeFile={resumeFile}
                    baseResume={baseResume}
                    onFileUpload={handleFileUpload}
                    uploadError={uploadError}
                    isValidating={isValidatingFile}
                  />
                </div>

                {/* Job Description Section */}
                <div className="space-y-4">
                  {/* Mobile: Show heading with section */}
                  <h2 className="md:hidden text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Job Description
                  </h2>
                  <JobDescriptionInput
                    jobDescription={jobDescription}
                    scrapingStatus={scrapingStatus}
                    onDescriptionChange={setJobDescription}
                    inputMode={inputMode}
                    onInputModeChange={setInputMode}
                  />
                </div>
              </div>

              <button
                onClick={analyzeResume}
                disabled={isAnalyzing || !resumeFile || !jobDescription}
                className="mt-6 mx-auto w-full sm:w-auto min-w-0 sm:min-w-[220px] md:min-w-[260px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Analyze
                  </>
                )}
              </button>

            </div>

            {/* Keyword Analysis Results */}
            {analysisComplete && keywordResults && (
              <div className="space-y-4" ref={resultsRef}>
                {/* 1. Job-Relevant Skills & Terms — no accordion, at the very top */}
                <KeywordAnalysis
                  actionableKeywords={keywordResults.actionableKeywords || []}
                  jobTitle={jobTitle}
                  company={company}
                  onKeywordsSelected={(selected) => {
                    setSelectedKeywords(selected);
                  }}
                  onOptimizeResume={handleOptimizeResume}
                  isOptimizing={isOptimizing}
                  clearSelections={clearKeywordSelections}
                />

                {/* 2. Optimized Resume Display (when available) */}
                {optimizationResult && optimizationResult.success && (
                  <>
                    {/* Action buttons card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                          <span>Resume Actions</span>
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-5">
                        Preview your AI-optimized resume, download it as a PDF, or head straight to the job application.
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <button
                          onClick={() => optimizedResumeRef.current?.openPreview()}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
                        >
                          <Eye className="w-5 h-5" />
                          Preview Resume
                        </button>
                        <button
                          onClick={() => optimizedResumeRef.current?.downloadPDF()}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium shadow-md"
                        >
                          <Download className="w-5 h-5" />
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleSetActiveTab('cover-letter')}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium shadow-md"
                        >
                          <Mail className="w-5 h-5" />
                          Create Cover Letter
                        </button>
                        {jobUrl && (
                          <a
                            href={jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-md"
                          >
                            <ExternalLink className="w-5 h-5" />
                            Apply for This Job
                          </a>
                        )}
                      </div>
                    </div>

                    <OptimizedResumeDisplay
                      ref={optimizedResumeRef}
                      result={optimizationResult}
                      originalResume={resumeText}
                      onClose={() => { setOptimizationResult(null); setOptimizedResumeText(''); }}
                      company={company}
                      jobUrl={jobUrl}
                    />
                  </>
                )}

                {/* 4. Job Match Score */}
                <MatchScoreCard result={keywordResults} />

                {/* 5. Job Posting Risk Scan */}
                {redFlagResult && (
                  <RedFlagScanner
                    result={redFlagResult}
                    onDismiss={() => setRedFlagResult(null)}
                  />
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'cover-letter' && (
          <div className="space-y-6">
            {resumeText && jobDescription ? (
              <CoverLetterDisplay
                resumeText={optimizedResumeText || resumeText}
                jobDescription={jobDescription}
                jobTitle={jobTitle}
                company={company}
                jobUrl={jobUrl}
                result={coverLetterResult}
                editedText={coverLetterEditedText}
                selectedTone={coverLetterTone}
                onResultChange={setCoverLetterResult}
                onEditedTextChange={setCoverLetterEditedText}
                onToneChange={setCoverLetterTone}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-10 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-2">
                  <Mail className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">No resume analysed yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  First analyse your resume and optimise it in the <strong>Analyze &amp; Optimize</strong> tab, then come back here to generate a tailored cover letter.
                </p>
                <button
                  onClick={() => handleSetActiveTab('analyze')}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Go to Analyze &amp; Optimize
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

// ── Accordion wrapper for result sections ────────────────────────────────────
interface SectionAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SectionAccordion({ title, children, defaultOpen = true }: SectionAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 mb-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && children}
    </div>
  );
}
