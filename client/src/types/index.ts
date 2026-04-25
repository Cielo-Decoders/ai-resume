export interface JobData {
  title: string;
  company: string;
  location: string;
  salary_range: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  experience_level: string;
  job_type: string;
  benefits: string[];
}

export interface SectionScore {
  score: number;
  issues: string[];
}

export interface Improvement {
  id?: string;
  category?: string;
  original?: string;
  improved?: string;
  section?: string;
  priority?: string;
  description?: string;
  selected?: boolean;
}

export interface AnalysisResults {
  success?: boolean;
  filename?: string;
  text?: string;
  fullText?: string;
  preview?: string;
  textLength?: number;
  fullTextLength?: number;
  overallScore: number;
  atsCompatibility: number;
  keywordMatch: number;
  formatting: number;
  jobData: JobData;
  sections: {
    contact: SectionScore;
    summary: SectionScore;
    experience: SectionScore;
    skills: SectionScore;
    education: SectionScore;
  };
  missingKeywords: string[];
  matchedKeywords: string[]; // added
  suggestedKeywords: string[];
  improvements: (string | Improvement)[];
  jobMatch: {
    title: string;
    company: string;
    location: string;
    matchPercentage: number;
    salaryRange: string;
  };
  salaryInsights: {
    estimatedSalary: string;
    marketAverage: string;
    topPercentile: string;
    yourEstimate: string;
    factors: string[];
  };
  interviewPrep: {
    likelyQuestions: string[];
    technicalTopics: string[];
    preparationTips: string[];
  };
  linkedinOptimization: {
    headlineScore: number;
    summaryScore: number;
    skillsScore: number;
    suggestions: string[];
  };
}

export interface Application {
  id: number;
  company: string;
  position: string;
  appliedDate: string;
  status: string;
  score: number;
  salary: string;
  location: string;
  nextStep: string;
  daysAgo: number;
}

export interface OptimizedResume {
  jobTitle: string;
  company: string;
  optimizedDate: string;
  score: number;
  keywords: string[];
}

export interface ActionableKeyword {
  keyword: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  selected?: boolean;
}

export interface KeywordAnalysisResult {
  success: boolean;
  matchScore: number;
  missingKeywords: string[];
  matchingKeywords: string[];
  missingPhrases: string[];
  matchingPhrases: string[];
  totalJobKeywords: number;
  suggestions: string[];
  actionableKeywords: ActionableKeyword[];
  filteredOutReasons?: string[];
}

export interface ResumeChange {
  section: string;
  description: string;
  keywordsAdded: string[];
}

export interface ResumeSection {
  type: 'header' | 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'other';
  title: string;
  content: string;
  items?: string[];
}

export interface ResumeFormatting {
  fontFamily: string;
  fontSize: number;
  headerStyle: string;
  bulletStyle: string;
  lineSpacing: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface OptimizationResult {
  success: boolean;
  message: string;
  optimizedResume: string;
  resumeSections?: ResumeSection[];
  changes?: ResumeChange[];
  atsScore: number;
  tips?: string[];
  formatting?: ResumeFormatting;
  keywordVerification?: {
    integrated: string[];
    missing: string[];
    integrationRate: number;
  };
  metadata?: {
    keywordsRequested: number;
    keywordsIntegrated: number;
    sectionsModified: number;
  };
}

export interface CoverLetterResult {
  success: boolean;
  message: string;
  coverLetter: string;
  tone: string;
  wordCount: number;
}

export interface RedFlag {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  evidence: string;
}

export interface RedFlagResult {
  success: boolean;
  score: number;
  verdict: string;
  overallRisk: 'low' | 'medium' | 'high';
  summary: string;
  flags: RedFlag[];
  positives: string[];
  questionsToAsk: string[];
}

export interface JobListing {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
  source?: string;
}
