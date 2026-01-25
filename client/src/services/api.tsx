import axios from 'axios';
import {JobData, AnalysisResults, KeywordAnalysisResult, ActionableKeyword, OptimizationResult } from '../types/index';

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
    const formData = new FormData();
    formData.append('resume', resumeFile);
    const response = await axios.post(`${API_URL}/api/extract-text`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    if (!response.data) {
      throw new Error('No response from server');
    }
    console.log('Analysis results:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('Backend analysis failed:', error);

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
 */
export const extractJobDataFromText = async (jobDescription: string): Promise<JobData> => {
  try {
    console.log('Extracting job data from text using AI...');

    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a job description analyzer. Extract structured data from job descriptions and return it as JSON.'
          },
          {
            role: 'user',
            content: `Extract the following information from this job description and return ONLY valid JSON (no markdown, no code blocks, just pure JSON):
{
  "title": "job title",
  "company": "company name",
  "location": "location",
  "salary": "$XXk - $XXk or description",
  "requirements": ["requirement 1", "requirement 2"],
  "responsibilities": ["responsibility 1"],
  "skills": ["skill 1", "skill 2"],
  "technologies": ["tech 1", "tech 2"],
  "tools": ["tool 1", "tool 2"],
  "qualifications": ["qualification 1"]
}

Job Description:
${jobDescription}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('OpenAI API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      console.error('OpenAI API error:', response.status, errorData);

      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key.');
      } else if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      } else if (response.status === 404) {
        throw new Error('OpenAI model not found. Please check the model name.');
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    console.log('OpenAI API Response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    const jsonString = data.choices[0].message.content.trim();
    console.log('Raw AI response:', jsonString);

    // Parse the JSON response
    let jobData;
    try {
      jobData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', jsonString);
      throw new Error('AI response is not valid JSON');
    }

    console.log('Successfully extracted job data:', jobData);

    return jobData;
  } catch (error: any) {
    console.error('Job data extraction failed:', error);

    // Don't mask specific error messages
    if (error.message.includes('OpenAI') ||
        error.message.includes('API key') ||
        error.message.includes('rate limit') ||
        error.message.includes('not valid JSON') ||
        error.message.includes('not configured')) {
      throw error;
    }

    throw new Error('Failed to extract job data. Please check your OpenAI API key.');
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
    console.log('Analyzing keywords...');
    console.log('Resume text length:', resumeText.length);
    console.log('Job data:', jobData);

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

    console.log('Keyword analysis results:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Keyword analysis failed:', error);

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
    console.log('Resume text length:', originalResumeText.length);
    console.log('Job description length:', jobDescription.length);
    console.log('Selected keywords count:', selectedKeywords.length);
    console.log('Selected keywords:', selectedKeywords.map(k => k.keyword));
    console.log('Job title:', jobTitle);

    // CRITICAL: Format keywords exactly as backend expects
    const formattedKeywords = selectedKeywords.map(k => ({
      keyword: k.keyword,
      category: k.category || 'Skill',
      priority: k.priority || 'medium'
    }));

    console.log('Formatted keywords:', formattedKeywords);

    const requestBody = {
      original_resume_text: originalResumeText,
      selected_keywords: formattedKeywords,
      job_description: jobDescription,
      job_title: jobTitle,
      formatting_info: null
    };

    console.log('Sending request to backend...');

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

    console.log('=== OPTIMIZATION RESPONSE ===');
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    console.log('Optimized resume length:', response.data.optimizedResume?.length);
    console.log('Metadata:', response.data.metadata);

    // Validate response
    if (!response.data.success) {
      throw new Error(response.data.message || 'Optimization failed');
    }

    if (!response.data.optimizedResume) {
      throw new Error('No optimized resume returned from server');
    }

    return response.data;
  } catch (error: any) {
    console.error('=== OPTIMIZATION ERROR ===');
    console.error('Error:', error);

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
 * Export functions for use in components
 */
export default {
  extractTextFromResume,
  extractJobDataFromText,
  analyzeKeywords,
  optimizeResume,
};