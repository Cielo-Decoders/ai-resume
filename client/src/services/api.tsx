import axios from 'axios';
import {JobData, AnalysisResults } from '../types/index';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

//TODO:
/**
 * Analyze resume by sending PDF to backend for extraction
 * Backend uses pdfreader to extract text and save to temp file
 */
 export const extractTextFromResume = async (
   resumeFile: File

 ): Promise<AnalysisResults> => {
   try {
     console.log('Sending resume to backend for analysis...');

     const formData = new FormData();
     formData.append('resume', resumeFile);

     const response = await axios.post(`http://127.0.0.1:8000/api/extract-text`, formData, {
       headers: {
         'Content-Type': 'multipart/form-data',
       },
       timeout: 60000, // 1 minute timeout for large files
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
        console.log('API Key exists:', !!process.env.REACT_APP_OPENAI_API_KEY);
        console.log('API Key prefix:', process.env.REACT_APP_OPENAI_API_KEY?.substring(0, 10));

        if (!process.env.REACT_APP_OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',  // Changed from gpt-4 to gpt-3.5-turbo for better availability
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
                                "salary_range": "$XXk - $XXk or description",
                                "requirements": ["requirement 1", "requirement 2", ...],
                                "responsibilities": ["responsibility 1", ...],
                                "skills": ["skill 1", "skill 2", ...],
                                "experience_level": "Junior/Mid/Senior",
                                "job_type": "Full-time/Part-time/Contract",
                                "benefits": ["benefit 1", "benefit 2", ...]
                                }

                        Job Description:${jobDescription}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

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

//TODO:
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
};

