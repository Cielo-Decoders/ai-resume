import axios from 'axios';
import {JobData, AnalysisResults } from '../types/index';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Analyze resume by sending PDF to backend for extraction
 * Backend uses pdfreader to extract text and save to temp file
 */
export const extractTextFromResume = async (
  resumeFile: File
): Promise<AnalysisResults> => {
  try {
    console.log('🚀 Sending resume to backend for analysis...', resumeFile.name);

    const formData = new FormData();
    formData.append('resume', resumeFile);

    const response = await axios.post(`${API_URL}/api/extract-text`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minute timeout for large files
    });

    if (!response.data) {
      throw new Error('No response from server');
    }

    console.log('✅ Backend analysis complete!');
    console.log('📊 Analysis results:', response.data);

    return response.data as AnalysisResults;
  } catch (error: any) {
    console.error('❌ Backend analysis failed:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config?.url,
    });

    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Analysis took too long. Please try with a smaller PDF file.');
    }

    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to backend server. Make sure it is running on port 8000.');
    }

    throw new Error(error.message || 'Failed to analyze resume. Please try again.');
  }
};

/**
 * Extract job data from pasted text using AI
 */
export const extractJobDataFromText = async (jobDescription: string): Promise<JobData> => {
  try {
    console.log('🔍 Extracting job data from text using backend AI...');

    const response = await fetch(`${API_URL}/api/extract-job-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_description: jobDescription
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend API error:', errorData);
      throw new Error(`Backend API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
    }

    const jobData = await response.json();
    console.log('✅ Successfully extracted job data:', jobData);

    return jobData as JobData;
  } catch (error: any) {
    console.error('❌ Job data extraction failed:', error);
    throw new Error(error.message || 'Failed to extract job data. Please check backend configuration.');
  }
};

/**
 * Optimize resume with AI
 */


//TODO:
/**
 * Generate optimized PDF from text content
 */


//TODO:
/**
 * Generate interview questions based on job data
 */

/**
 * Export functions for use in components
 */

export default {
  extractJobDataFromText,
  extractTextFromResume,
};
