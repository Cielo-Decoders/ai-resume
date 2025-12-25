import React, { useState } from 'react';
import { Upload, Zap, CheckCircle } from 'lucide-react';
import TabNavigation from '../components/tabs/TabNavigation';
import ResumeUpload from '../components/resume/ResumeUpload';
import KeywordAnalysis from '../components/resume/KeywordAnalysis';
import OptimizedResumeDisplay from '../components/resume/OptimizedResumeDisplay';
import {Application, JobData, KeywordAnalysisResult, ActionableKeyword, OptimizationResult } from '../types/index';
import {extractJobDataFromText, extractTextFromResume, analyzeKeywords, optimizeResume} from '../services/api';
import JobDescriptionInput from '../components/jobs/JobDescriptionInput';

export default function ATSAnalyzer() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode] = useState<'paste'>('paste');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [baseResume, setBaseResume] = useState<File | null>(null);
  const [scrapingStatus, setScrapingStatus] = useState('');
  const [keywordResults, setKeywordResults] = useState<KeywordAnalysisResult | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // New state for optimization
  const [resumeText, setResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<ActionableKeyword[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      if (!baseResume) {
        setBaseResume(file);
      }
    } else {
      alert('Please upload a PDF file');
    }
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

  try {
    let jobData: JobData;
    let extractedResumeText: string = '';

    // Step 1: Extract job data from description
    if (inputMode === 'paste') {
      setScrapingStatus('Extracting job details with AI...');
      try {
        jobData = await extractJobDataFromText(jobDescription);
        console.log('Job data extracted:', jobData);
        // Store job title for optimization
        setJobTitle(jobData.title || '');
      } catch (error) {
        console.error('AI extraction failed:', error);
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
      console.log('Starting resume analysis with actual PDF content...');
      const aiResults = await extractTextFromResume(resumeFile!);
      console.log('AI analysis complete with real data:', aiResults);
      extractedResumeText = aiResults.text || '';

      if (!extractedResumeText || extractedResumeText.length < 50) {
        throw new Error('Could not extract meaningful text from the resume');
      }
      
      // Store resume text for optimization
      setResumeText(extractedResumeText);
    } catch (error: any) {
      console.error('AI analysis failed:', error);

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
      console.log('Keyword analysis complete:', keywordAnalysis);
      setKeywordResults(keywordAnalysis);
      setAnalysisComplete(true);
    } catch (error: any) {
      console.error('Keyword analysis failed:', error);
      alert(`Keyword analysis failed: ${error.message}`);
    }

    setScrapingStatus('');
    setIsAnalyzing(false);

  } catch (error) {
    console.error('Job description retrieval failed:', error);
    alert('Failed to retrieve job description. Please try again.');
    setScrapingStatus('');
    setIsAnalyzing(false);
  }
};

  // Handle resume optimization with selected keywords
  const handleOptimizeResume = async (keywords: ActionableKeyword[]) => {
    if (!resumeText) {
      alert('Resume text not available. Please analyze your resume first.');
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

    try {
      console.log('Starting resume optimization with keywords:', keywords);
      const result = await optimizeResume(
        resumeText,
        jobDescription,
        keywords,
        jobTitle
      );

      if (result.success) {
        setOptimizationResult(result);
        console.log('Resume optimization successful:', result);
      } else {
        alert(`Optimization failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Resume optimization failed:', error);
      alert(`Failed to optimize resume: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          {/* Top Bar with User Menu */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap className="w-12 h-12 text-indigo-600" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ATS Analyzer Pro
                </h1>
                <p className="text-gray-600 hidden sm:block">
                  Welcome!
                </p>
              </div>
            </div>
            {/* User Menu */}
          </div>
          {/* Subtitle and Resume Info */}
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">
              AI-Powered Resume Optimization • Job Tracker • Interview Prep • Salary Insights
            </p>
            {baseResume && (
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4" />
                Base Resume: {baseResume.name}
              </div>
            )}
          </div>
        </div>
        {/* Navigation Tabs */}
        <TabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          applicationsCount={applications.length}
        />
        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Upload className="w-6 h-6 text-indigo-600" />
                Upload & Analyze
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <ResumeUpload
                  resumeFile={resumeFile}
                  baseResume={baseResume}
                  onFileUpload={handleFileUpload}
                />
                <JobDescriptionInput
                  jobDescription={jobDescription}
                  scrapingStatus={scrapingStatus}
                  onDescriptionChange={setJobDescription}
                  inputMode={inputMode}
                  onInputModeChange={setInputMode}
                />
              </div>
              <button
                onClick={analyzeResume}
                disabled={isAnalyzing || !resumeFile || !jobDescription}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze
                  </>
                )}
              </button>
            </div>

            {/* Keyword Analysis Results */}
            {analysisComplete && keywordResults && (
              <div className="space-y-6">
                {/* Match Score Card */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Keyword Match Score</h3>
                      <p className="text-gray-500">How well your resume matches the job description</p>
                    </div>
                    <div className={`text-4xl font-bold ${
                      keywordResults.matchScore >= 70 ? 'text-green-600' :
                      keywordResults.matchScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {keywordResults.matchScore}%
                    </div>
                  </div>
                  {keywordResults.suggestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-700 mb-2">Suggestions:</h4>
                      <ul className="space-y-1">
                        {keywordResults.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-indigo-500">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Missing and Matching Keywords */}
                <KeywordAnalysis
                  missingKeywords={keywordResults.missingPhrases.length > 0 
                    ? keywordResults.missingPhrases 
                    : keywordResults.missingKeywords.slice(0, 15)}
                  suggestedKeywords={keywordResults.matchingPhrases.length > 0 
                    ? keywordResults.matchingPhrases 
                    : keywordResults.matchingKeywords.slice(0, 15)}
                  actionableKeywords={keywordResults.actionableKeywords || []}
                  onKeywordsSelected={(selected) => {
                    console.log('Selected keywords for optimization:', selected);
                    setSelectedKeywords(selected);
                  }}
                  onOptimizeResume={handleOptimizeResume}
                  isOptimizing={isOptimizing}
                />

                {/* Optimized Resume Display */}
                {optimizationResult && optimizationResult.success && (
                  <OptimizedResumeDisplay
                    result={optimizationResult}
                    onClose={() => setOptimizationResult(null)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

