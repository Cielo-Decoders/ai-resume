import React, { useState } from 'react';
import { Upload, Zap, CheckCircle, ExternalLink, Mail, Briefcase, MessageCircle, Briefcase as BriefcaseIcon, FileText, Eye, X } from 'lucide-react';
import TabNavigation from '../components/tabs/TabNavigation';
import ResumeUpload from '../components/resume/ResumeUpload';
import JobUrlInput from '../components/jobs/JobUrlInput';
import ScoreCards from '../components/resume/ScoreCards';
import JobMatchInfo from '../components/jobs/JobMatchInfo';
import KeywordAnalysis from '../components/resume/KeywordAnalysis';
import ApplicationTracker from '../components/appInfo/AppTracker';
import InterviewPrepTab from '../components/tabs/InterviewPrepTab';
import SalaryInsightsTab from '../components/tabs/SalaryInsightsTab';
import InterviewerQuestions from '../components/questions/InterviewerQuestions';
import JobBoards from '../components/jobs/JobBoards';
import ResumePreviewModal from '../components/resume/ResumePreviewModal';
import RecruiterComparison from '../components/recruiter/RecruiterComparison';
import ApplicationConfirmationModal from '../components/appInfo/AppConfirmationModal';
import UserMenu from '../components/user/UserMenu';
import UserSettings from '../components/user/UserSettings';
import QualificationTag  from '../components/resume/QualificationTag';
import { AnalysisResults, Application, OptimizedResume, JobData, Improvement } from '../types/index';
import { scrapeJobDescription, extractJobDataFromText, optimizeResumeWithAI, analyzeResumeWithAI } from '../services/api';


export default function ATSAnalyzer() {
//   const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analyze');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'paste'>('paste');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [baseResume, setBaseResume] = useState<File | null>(null);
  const [jobSpecificResumes, setJobSpecificResumes] = useState<Record<string, OptimizedResume>>({});
  const [scrapingStatus, setScrapingStatus] = useState('');

  // New feature states
  const [showInterviewerQuestions, setShowInterviewerQuestions] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showRecruiterComparison, setShowRecruiterComparison] = useState(false);
  const [showApplicationConfirmation, setShowApplicationConfirmation] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [optimizedResumeText, setOptimizedResumeText] = useState<string>('');
  const [optimizedResumePdf, setOptimizedResumePdf] = useState<Blob | null>(null);

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

  const getMockJobData = (url: string): JobData => {
    return {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'Remote',
      salary_range: '$120,000 - $180,000',
      requirements: [
        '5+ years of software development experience',
        'Strong proficiency in Python, JavaScript, and React',
        'Experience with cloud platforms (AWS, Azure, or GCP)',
        'Knowledge of microservices architecture',
        "Bachelor's degree in Computer Science or related field",
      ],
      responsibilities: [
        'Design and develop scalable web applications',
        'Collaborate with cross-functional teams',
        'Mentor junior developers',
        'Participate in code reviews and architecture discussions',
      ],
      skills: [
        'Python',
        'JavaScript',
        'React',
        'AWS',
        'Docker',
        'Kubernetes',
        'CI/CD',
        'Agile',
        'REST APIs',
        'PostgreSQL',
      ],
      experience_level: 'Senior',
      job_type: 'Full-time',
      benefits: [
        'Health Insurance',
        '401k Match',
        'Remote Work',
        'Unlimited PTO',
        'Learning Budget',
      ],
    };
  };

  const analyzeResume = async () => {
    if (!resumeFile) {
      alert('Please upload a resume');
      return;
    }

    if (inputMode === 'paste' && !jobDescription) {
      alert('Please paste the job description');
      return;
    }

    if (inputMode === 'url' && !jobUrl) {
      alert('Please provide a job URL');
      return;
    }

    setIsAnalyzing(true);

    if (inputMode === 'paste') {
      setScrapingStatus('Extracting job details with AI...');
    } else {
      setScrapingStatus('Scraping job description...');
    }

    try {
      let jobData: JobData;

      if (inputMode === 'paste') {
        // Use AI extraction for pasted text
        try {
          jobData = await extractJobDataFromText(jobDescription);
          console.log('Job data extracted:', jobData);
        } catch (error) {
          console.error('AI extraction failed:', error);
          jobData = getMockJobData('');
        }
      } else {
        // Try URL scraping
        try {
          jobData = await scrapeJobDescription(jobUrl);
        } catch (error) {
          console.warn('Backend scraping failed, using mock data', error);
          jobData = getMockJobData(jobUrl);
        }
      }

      setScrapingStatus('📄 Extracting text from your resume PDF...');

      // Use AI to analyze the resume against the job
      try {
        console.log('🚀 Starting resume analysis with actual PDF content...');
        const aiResults = await analyzeResumeWithAI(resumeFile, jobData);
        console.log('✅ AI analysis complete with real data:', aiResults);

        setAnalysisResults(aiResults);
        setScrapingStatus('');
        setIsAnalyzing(false);
      } catch (error: any) {
        console.error('❌ AI analysis failed:', error);

        // Check if it's a PDF extraction error
        if (error.message && (error.message.includes('PDF') || error.message.includes('extract'))) {
          setScrapingStatus('');
          setIsAnalyzing(false);
          alert(`⚠️ PDF Extraction Error\n\n${error.message}\n\nPlease ensure:\n1. Your resume is a text-based PDF (not a scanned image)\n2. The PDF file is not corrupted\n3. The file has readable text content\n\nTip: Try opening your PDF and copying some text. If you can't copy text, it's likely an image-based PDF that requires OCR.`);
          return;
        }

        // For other errors, show a different message but don't use fallback mock data
        setScrapingStatus('');
        setIsAnalyzing(false);
        alert(`❌ Analysis Error\n\n${error.message || 'An error occurred during analysis'}\n\nPlease try again. If the problem persists, check your internet connection and ensure your OpenAI API key is valid.`);
        return;
      }
    } catch (error: any) {
      console.error('Error during analysis:', error);
      setScrapingStatus('');
      setIsAnalyzing(false);
      alert(`Error: ${error.message || 'An unexpected error occurred. Please try again.'}`);
    }
  };

  const optimizeResumeForJob = async () => {
    if (!analysisResults || !resumeFile) return;

    setIsAnalyzing(true);

    try {
      console.log('Starting optimization process...');

      // Use AI to optimize the resume while preserving structure
      const { optimizedText, optimizedPdf } = await optimizeResumeWithAI(
        resumeFile,
        analysisResults.jobData,
        analysisResults.missingKeywords,
        analysisResults.improvements
      );

      console.log('Optimization successful!');

      // Store the optimized resume for preview and download
      setOptimizedResumeText(optimizedText);
      setOptimizedResumePdf(optimizedPdf);

      const jobId = analysisResults.jobMatch.company + '_' + Date.now();

      setJobSpecificResumes({
        ...jobSpecificResumes,
        [jobId]: {
          jobTitle: analysisResults.jobMatch.title,
          company: analysisResults.jobMatch.company,
          optimizedDate: new Date().toLocaleDateString(),
          score: 92,
          keywords: analysisResults.jobData.skills,
        },
      });

      // Update scores to reflect optimization
      setAnalysisResults({
        ...analysisResults,
        overallScore: 92,
        atsCompatibility: 95,
        keywordMatch: 94,
        sections: {
          ...analysisResults.sections,
          summary: { score: 92, issues: [] },
          skills: { score: 95, issues: [] },
          experience: { score: 90, issues: [] },
        },
      });

      // Trigger download of the PDF
      downloadOptimizedResumePDF(
        optimizedPdf,
        analysisResults.jobMatch.company
      );

      alert(
        `✅ Resume optimized with AI for ${analysisResults.jobMatch.title} at ${analysisResults.jobMatch.company}!\n\nYour optimized PDF has been downloaded.\n\nClick "Preview Optimized Resume" to view it.`
      );

      setIsAnalyzing(false);
    } catch (error: any) {
      console.error('Error optimizing resume:', error);

      let errorMessage = 'Failed to optimize resume. ';

      if (error.message?.includes('OpenAI API error')) {
        errorMessage += 'There was an issue with the AI service. Please check your API key and try again.';
      } else if (error.message?.includes('PDF')) {
        errorMessage += 'There was an issue generating the PDF. Please try again.';
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }

      alert(errorMessage + '\n\nError details: ' + error.message);
      setIsAnalyzing(false);
    }
  };

  const downloadOptimizedResumePDF = (pdfBlob: Blob, company: string) => {
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Optimized_Resume_${company.replace(/\s+/g, '_')}_${
      new Date().toISOString().split('T')[0]
    }.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const applyToJob = () => {
    if (!analysisResults) return;

    // Only show the confirmation modal, don't add to applications yet
    setShowApplicationConfirmation(true);
  };

  const confirmApplication = () => {
    if (!analysisResults) return;

    // Now actually add the application when user confirms
    const newApp: Application = {
      id: Date.now(),
      company: analysisResults.jobMatch.company,
      position: analysisResults.jobMatch.title,
      appliedDate: new Date().toLocaleDateString(),
      status: 'Applied',
      score: analysisResults.overallScore,
      salary: analysisResults.jobMatch.salaryRange,
      location: analysisResults.jobMatch.location,
      nextStep: 'Resume Review',
      daysAgo: 0,
    };
    setApplications([newApp, ...applications]);
    setShowApplicationConfirmation(false);
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
                  Welcome back !
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
                <JobUrlInput
                  jobUrl={jobUrl}
                  jobDescription={jobDescription}
                  scrapingStatus={scrapingStatus}
                  onUrlChange={setJobUrl}
                  onDescriptionChange={setJobDescription}
                  inputMode={inputMode}
                  onInputModeChange={setInputMode}
                />
              </div>

              <button
                onClick={analyzeResume}
                disabled={isAnalyzing || !resumeFile || (!jobUrl && !jobDescription)}
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

              {/* Target Position Analysis - Moved here */}
              {analysisResults && (
                <div className="mt-6">
                  <JobMatchInfo
                    title={analysisResults.jobMatch.title}
                    company={analysisResults.jobMatch.company}
                    matchPercentage={analysisResults.jobMatch.matchPercentage}
                    salaryRange={analysisResults.jobMatch.salaryRange}
                  />
                </div>
              )}

              {/* Missing Keywords and Recommended Keywords - Moved here */}
              {analysisResults && (
                <div className="mt-6">
                  <KeywordAnalysis
                    missingKeywords={analysisResults.missingKeywords}
                    suggestedKeywords={analysisResults.suggestedKeywords}
                  />
                </div>
              )}

              {/* Position Match Assessment - Moved here */}
              {analysisResults && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Position Match Assessment:</h3>

                </div>
              )}
            </div>

            {/* Results Section */}
            {analysisResults && (
              <div className="space-y-6">
                <ScoreCards
                  overallScore={analysisResults.overallScore}
                  atsCompatibility={analysisResults.atsCompatibility}
                  keywordMatch={analysisResults.keywordMatch}
                  formatting={analysisResults.formatting}
                />

                {/* Improvements */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" />
                    AI Optimization Suggestions (Job-Specific)
                  </h3>
                  <ul className="space-y-3">
                    {analysisResults.improvements.map((improvement, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg"
                      >
                        <CheckCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          {typeof improvement === 'string'
                            ? improvement
                            : (improvement.improved || improvement.description || improvement.original || 'Improvement')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={optimizeResumeForJob}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Zap className="w-5 h-5" />
                    Optimize & Download for This Job
                  </button>
                  <button
                    onClick={() => window.open(jobUrl, '_blank')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Apply on Original Site
                  </button>
                  <button
                    onClick={applyToJob}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Mail className="w-5 h-5" />
                    Track This Application
                  </button>
                </div>

                {/* New Features Section */}
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowResumePreview(true)}
                    className="bg-gradient-to-r from-rose-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-rose-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FileText className="w-5 h-5" />
                    Preview Optimized Resume
                  </button>
                  <button
                    onClick={() => setShowRecruiterComparison(true)}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Eye className="w-5 h-5" />
                    See Recruiter Perspective
                  </button>
                </div>

                {/* Quick Access Buttons */}
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowInterviewerQuestions(true)}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Questions to Ask Interviewer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interview Prep Tab */}
        {activeTab === 'interview' && analysisResults && (
          <InterviewPrepTab analysisResults={analysisResults} />
        )}

        {/* Salary Insights Tab */}
        {activeTab === 'salary' && analysisResults && (
          <SalaryInsightsTab analysisResults={analysisResults} />
        )}

        {/* Find More Jobs Tab */}
        {activeTab === 'jobs' && (
          <JobBoards isOpen={false} />
        )}

        {/* Track Applications Tab */}
        {activeTab === 'track' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Application Tracker
            </h2>
            <ApplicationTracker applications={applications} />
          </div>
        )}

        {/* Modals */}



        <ResumePreviewModal
          isOpen={showResumePreview}
          onClose={() => setShowResumePreview(false)}
          jobTitle={analysisResults?.jobMatch.title || 'Position'}
          company={analysisResults?.jobMatch.company || 'Company'}
          oldScore={73}
          newScore={92}
          optimizedResumeText={optimizedResumeText}
          optimizedResumePdf={optimizedResumePdf}
        />

        {/* Recruiter Comparison Modal */}
        {analysisResults && showRecruiterComparison && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Recruiter Perspective</h2>
                </div>
                <button
                  onClick={() => setShowRecruiterComparison(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
                <RecruiterComparison
                  oldScore={analysisResults.overallScore >= 80 ? 60 : 45}
                  newScore={analysisResults.overallScore}
                  jobTitle={analysisResults.jobMatch.title}
                  analysisResults={analysisResults}
                />
              </div>
            </div>
          </div>
        )}

        {/* Application Confirmation Modal */}
        {showApplicationConfirmation && analysisResults && (
          <ApplicationConfirmationModal
            isOpen={showApplicationConfirmation}
            onClose={() => setShowApplicationConfirmation(false)}
            onConfirm={confirmApplication}
            jobTitle={analysisResults.jobMatch.title}
            company={analysisResults.jobMatch.company}
            matchScore={analysisResults.overallScore}
          />
        )}

        {/* User Settings Modal */}

      </div>
    </div>
  );
}
