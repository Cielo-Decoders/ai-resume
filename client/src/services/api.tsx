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
     console.log('🚀 Sending resume to backend for analysis...');

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

     console.log('✅ Backend analysis complete!');
     console.log('📊 Analysis results:', response.data);

     return response.data;
   } catch (error: any) {
     console.error('❌ Backend analysis failed:', error);

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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
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

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API error:', errorData);
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const jsonString = data.choices[0].message.content.trim();

        // Parse the JSON response
        const jobData = JSON.parse(jsonString);

        console.log('Successfully extracted job data:', jobData);

        return jobData;
    } catch (error: any) {
        console.error('Job data extraction failed:', error);
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

