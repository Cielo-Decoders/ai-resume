import axios from 'axios';
import {JobData, AnalysisResults, KeywordAnalysisResult, ActionableKeyword, OptimizationResult, CoverLetterResult, RedFlagResult, MockInterviewResult, AnswerEvaluationResult } from '../types/index';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';


/**
 * Analyze resume by sending PDF to backend for extraction
 * Backend uses pdfreader to extract text and save to temp file
 */
export const extractTextFromResume = async (
  resumeFile: File
): Promise<AnalysisResults> => {
  try {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    const response = await axios.post(`${API_URL}/api/extract-text`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000,
    });

    if (!response.data) {
      throw new Error('No response from server');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Analysis took too long. Please try with a smaller PDF file.');
    }

    throw new Error(error.message || 'Failed to analyze resume. Please try again.');
  }
};

/**
 * Extract job data from pasted text using AI
 * NOTE: Routes through the backend server to avoid CORS and keep the API key secure.
 */
export const extractJobDataFromText = async (jobDescription: string): Promise<JobData> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/extract-job`,
      { job_description: jobDescription },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000,
      }
    );

    if (!response.data) {
      throw new Error('No response from server');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Job extraction timed out. Please try again.');
    }

    throw new Error(error.message || 'Failed to extract job data. Please try again.');
  }
};

/**
 * Analyze resume keywords against job description
 * CRITICAL: This calls the backend to compare resume vs job and get actionable keywords
 */
export const analyzeKeywords = async (
  resumeText: string,
  jobData: JobData
): Promise<KeywordAnalysisResult> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/analyze-keywords`,
      {
        resume_text: resumeText,
        job_data: jobData
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 90000,
      }
    );

    if (!response.data) {
      throw new Error('No response from server');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    throw new Error(error.message || 'Failed to analyze keywords. Please try again.');
  }
};

/**
 * Optimize resume with AI by integrating selected keywords
 */
export const optimizeResume = async (
  originalResumeText: string,
  jobDescription: string,
  selectedKeywords: ActionableKeyword[],
  jobTitle: string = ''
): Promise<OptimizationResult> => {
  try {
    // CRITICAL: Format keywords exactly as backend expects
    const formattedKeywords = selectedKeywords.map(k => ({
      keyword: k.keyword,
      category: k.category || 'Skill',
      priority: k.priority || 'medium'
    }));

    const requestBody = {
      original_resume_text: originalResumeText,
      selected_keywords: formattedKeywords,
      job_description: jobDescription,
      job_title: jobTitle,
      formatting_info: null
    };

    const response = await axios.post(
      `${API_URL}/api/optimize-resume`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minute timeout for AI generation
      }
    );

    if (!response.data) {
      throw new Error('No response from server');
    }

    // Validate response
    if (!response.data.success) {
      throw new Error(response.data.message || 'Optimization failed');
    }

    if (!response.data.optimizedResume) {
      throw new Error('No optimized resume returned from server');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Optimization took too long. Please try again with fewer keywords.');
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to optimize resume. Please try again.');
  }
};

/**
 * Send contact form message via backend API (no email client prompt)
 */
export const sendContactMessage = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post(
    `${API_URL}/api/contact`,
    data,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    }
  );
  return response.data;
};

/**
 * Generate a tailored cover letter based on resume and job description
 */
export const generateCoverLetter = async (
  resumeText: string,
  jobDescription: string,
  jobTitle: string = '',
  company: string = '',
  tone: string = 'professional'
): Promise<CoverLetterResult> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/generate-cover-letter`,
      {
        resume_text: resumeText,
        job_description: jobDescription,
        job_title: jobTitle,
        company: company,
        tone: tone,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    if (!response.data) {
      throw new Error('No response from server');
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Cover letter generation failed');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Cover letter generation timed out. Please try again.');
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to generate cover letter. Please try again.');
  }
};

/**
 * Export functions for use in components
 */
/**
 * Scan a job description for red flags and risk assessment
 */
export const scanJobRedFlags = async (
  jobDescription: string
): Promise<RedFlagResult> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/scan-red-flags`,
      { job_description: jobDescription },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    if (!response.data) {
      throw new Error('No response from server');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Red flag scan timed out. Please try again.');
    }

    throw new Error(error.message || 'Failed to scan job description. Please try again.');
  }
};


/**
 * Generate mock interview questions based on resume and job description
 */
export const generateInterviewQuestions = async (
  resumeText: string,
  jobDescription: string,
  count: number = 5,
  persona: string = 'professional'
): Promise<MockInterviewResult> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/generate-interview`,
      {
        resume_text: resumeText,
        job_description: jobDescription,
        count,
        persona,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    if (!response.data) {
      throw new Error('No response from server');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Interview generation timed out. Please try again.');
    }

    throw new Error(error.message || 'Failed to generate interview questions. Please try again.');
  }
};

/**
 * Evaluate a candidate's answer to an interview question
 */
export const evaluateInterviewAnswer = async (
  question: string,
  answer: string,
  jobDescription: string
): Promise<AnswerEvaluationResult> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/evaluate-answer`,
      {
        question,
        answer,
        job_description: jobDescription,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    if (!response.data) {
      throw new Error('No response from server');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Answer evaluation timed out. Please try again.');
    }

    throw new Error(error.message || 'Failed to evaluate answer. Please try again.');
  }
};

const apiService = {
  extractTextFromResume,
  extractJobDataFromText,
  analyzeKeywords,
  optimizeResume,
  sendContactMessage,
  generateCoverLetter,
  scanJobRedFlags,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
};

export default apiService;
