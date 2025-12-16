import React, { useState } from 'react';
import { Upload, Zap, CheckCircle } from 'lucide-react';
import TabNavigation from '../components/tabs/TabNavigation';
import ResumeUpload from '../components/resume/ResumeUpload';
import {Application, JobData, AnalysisResults } from '../types/index';
import {extractJobDataFromText, extractTextFromResume} from '../services/api';
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
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

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
      alert('Please upload a resume PDF file');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      // Step 1: Extract job data from description
      if (inputMode === 'paste') {
        setScrapingStatus('Extracting job details with AI...');
        try {
          const jobData = await extractJobDataFromText(jobDescription);
          console.log('✅ Job data extracted:', jobData);
          setScrapingStatus('');
        } catch (error) {
          console.error('❌ AI extraction failed:', error);
          alert(`Failed to extract job data: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setScrapingStatus('');
          setIsAnalyzing(false);
          return;
        }
      }

      // Step 2: Extract resume and analyze
      setScrapingStatus('Analyzing resume...');
      try {
        console.log('🚀 Starting resume analysis...');
        const aiResults = await extractTextFromResume(resumeFile);
        console.log('✅ Resume analysis complete:', aiResults);

        setAnalysisResults(aiResults);
        setScrapingStatus('');
        setIsAnalyzing(false);

        // Optionally auto-switch to results tab
        console.log('Analysis finished successfully!');
      } catch (error) {
        console.error('❌ Resume analysis failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('PDF') || errorMessage.includes('extract')) {
          alert(`⚠️ PDF Extraction Error\n\n${errorMessage}\n\nPlease ensure:\n1. Your resume is a text-based PDF (not a scanned image)\n2. The PDF file is not corrupted\n3. The file has readable text content`);
        } else {
          alert(`Analysis failed: ${errorMessage}`);
        }

        setScrapingStatus('');
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Unexpected error during analysis:', error);
      alert('An unexpected error occurred. Please try again.');
      setScrapingStatus('');
      setIsAnalyzing(false);
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
          </div>
        )}
      </div>
    </div>
  );
}
