import axios from 'axios';
import {JobData, AnalysisResults, KeywordAnalysisResult, ActionableKeyword, OptimizationResult } from '../types/index';

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
        timeout: 30000,
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
        timeout: 30000,
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
 * Export functions for use in components
 */
const apiService = {
  extractTextFromResume,
  extractJobDataFromText,
  analyzeKeywords,
  optimizeResume,
  sendContactMessage,
};

export default apiService;
