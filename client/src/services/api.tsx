import axios from 'axios';
import { AnalysisResults, JobData } from '../types/index';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

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
export const analyzeResumeWithAI = async (
  resumeFile: File,
  jobData: JobData
): Promise<AnalysisResults> => {
  try {
    console.log('🚀 Sending resume to backend for analysis...');

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobData', JSON.stringify(jobData));

    const response = await axios.post(`${API_URL}/api/analyze`, formData, {
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
 * Scrape job description from URL
 */
export const scrapeJobDescription = async (url: string): Promise<JobData> => {
  try {
    console.log('🌐 Scraping job description from:', url);

    const response = await api.post('/api/scrape', { url });

    if (!response.data) {
      throw new Error('No data returned from scraper');
    }

    console.log('✅ Job scraping complete');
    return response.data;
  } catch (error: any) {
    console.error('❌ Scraping failed:', error);
    throw new Error('Failed to scrape job description. Please paste the job description instead.');
  }
};

/**
 * Extract job data from pasted text using AI
 */
export const extractJobDataFromText = async (jobDescription: string): Promise<JobData> => {
  try {
    console.log('🤖 Extracting job data from text using AI...');

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

Job Description:
${jobDescription}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const jsonString = data.choices[0].message.content.trim();

    // Parse the JSON response
    const jobData = JSON.parse(jsonString);

    console.log('✅ Job data extracted successfully');
    console.log('📊 Extracted job data:', jobData);

    return jobData;
  } catch (error: any) {
    console.error('❌ Job data extraction failed:', error);
    throw new Error('Failed to extract job data. Please check your OpenAI API key.');
  }
};

/**
 * Optimize resume with AI
 */
export const optimizeResumeWithAI = async (
  resumeFile: File,
  jobData: JobData,
  missingKeywords: string[],
  improvements: string[]
): Promise<{ optimizedText: string; optimizedPdf: Blob }> => {
  try {
    console.log('🔄 Starting resume optimization...');
    console.log('📋 Job Title:', jobData.title);
    console.log('🏢 Company:', jobData.company);
    console.log('🎯 Missing Keywords to add:', missingKeywords);

    // Step 1: Send PDF to backend to extract text
    const formData = new FormData();
    formData.append('resume', resumeFile);

    console.log('📤 Uploading resume to backend for text extraction...');
    const extractResponse = await axios.post(`${API_URL}/api/extract-text`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    if (!extractResponse.data || !extractResponse.data.text) {
      throw new Error('Failed to extract resume text from backend. Server did not return extracted text.');
    }

    const originalResumeText = extractResponse.data.text;
    console.log('✅ Resume text successfully extracted from backend');
    console.log('📊 Extracted text length:', originalResumeText.length, 'characters');
    console.log('📝 Text preview:', originalResumeText.substring(0, 300));

    // Step 2: Call OpenAI to optimize the resume based on job description
    console.log('🤖 Sending to OpenAI for AI-powered optimization...');
    const optimizationPrompt = `You are an expert ATS resume optimizer. Your task is to enhance the user's resume to better match the specific job they are applying for.

CRITICAL INSTRUCTIONS:
1. PRESERVE the user's original resume structure, sections, and order
2. KEEP approximately the same length (don't make it much longer or shorter)
3. MAINTAIN the user's authentic writing style and tone
4. ENHANCE existing content by naturally incorporating relevant keywords and metrics
5. DO NOT create a new resume from scratch
6. DO NOT add sections that weren't in the original resume
7. DO NOT drastically change the format or reorder sections

JOB THEY ARE APPLYING FOR:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
Required Skills: ${jobData.skills.join(', ')}

KEY REQUIREMENTS:
${jobData.requirements.slice(0, 8).join('\n')}

KEYWORDS TO NATURALLY INCORPORATE:
${missingKeywords.slice(0, 15).join(', ')}

TOP REQUIRED SKILLS TO EMPHASIZE:
${jobData.skills.slice(0, 8).join(', ')}

USER'S ORIGINAL RESUME (PRESERVE THIS STRUCTURE AND CONTENT):
---START OF RESUME---
${originalResumeText}
---END OF RESUME---

// TODO: Include user feedback on job skills to add to resume (rather than automatically adding all missing keywords)

OPTIMIZATION TASKS:
1. Naturally add these missing keywords: ${missingKeywords.slice(0, 10).join(', ')}
2. Strengthen achievement statements by adding metrics or quantifiable results where appropriate
3. Emphasize experience with: ${jobData.skills.slice(0, 8).join(', ')}
4. Improve ATS compatibility by:
   - Using clear section headers
   - Using standard bullet points
   - Removing special characters or formatting that scanners might misread
5. Fix any grammar, spelling, or formatting issues
6. Ensure the resume reads naturally and authentically

RETURN ONLY THE OPTIMIZED RESUME TEXT - Do not include any explanations, markdown, or additional text. Just the resume content.`;

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
            content: 'You are an expert ATS resume optimizer. Your job is to enhance resumes while preserving their original structure and content. You only return the optimized resume text, nothing else.'
          },
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const optimizedText = data.choices[0].message.content.trim();
    console.log('✅ AI optimization complete');
    console.log('📊 Optimized text length:', optimizedText.length, 'characters');

    // Step 3: Generate PDF from optimized text
    console.log('📄 Generating optimized PDF...');
    const pdfBlob = await generateOptimizedPDF(optimizedText, jobData);
    console.log('✅ PDF generated successfully');

    return { optimizedText, optimizedPdf: pdfBlob };
  } catch (error: any) {
    console.error('❌ Error optimizing resume with AI:', error);
    throw new Error(error.message || 'Failed to optimize resume. Please check your internet connection and OpenAI API key.');
  }
};

/**
 * Generate optimized PDF from text content
 */
export const generateOptimizedPDF = async (
  content: string,
  jobData: JobData
): Promise<Blob> => {
  try {
    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage([612, 792]); // US Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 742; // Start near top
    const margin = 50;
    const lineHeight = 14;
    const maxWidth = 512; // 612 - 2*50 margins
    const fontSize = 11;
    const boldFontSize = 12;

    // Helper function to add new page
    const addNewPage = () => {
      currentPage = pdfDoc.addPage([612, 792]);
      yPosition = 742;
    };

    // Helper function to draw wrapped text
    const drawText = (text: string, isBold: boolean = false, size: number = fontSize) => {
      if (!text || text.trim() === '') return;

      const textFont = isBold ? boldFont : font;
      const words = text.split(' ');
      let line = '';

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const width = textFont.heightAtSize(size) * (testLine.length * 0.5); // Approximate width

        if (width > maxWidth && line) {
          currentPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: size,
            font: textFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;

          if (yPosition < margin) {
            addNewPage();
          }

          line = word;
        } else {
          line = testLine;
        }
      }

      if (line) {
        currentPage.drawText(line, {
          x: margin,
          y: yPosition,
          size: size,
          font: textFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }

      if (yPosition < margin) {
        addNewPage();
      }
    };

    // Draw the content
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        yPosition -= lineHeight / 2;
        continue;
      }

      // Check if line looks like a section header (all caps or ends with colon)
      const isSectionHeader = /^[A-Z\s]+$/.test(trimmedLine) || trimmedLine.endsWith(':');
      drawText(trimmedLine, isSectionHeader, isSectionHeader ? boldFontSize : fontSize);
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error: any) {
    console.error('❌ Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Generate interview questions based on job data
 */
export const generateInterviewerQuestions = async (jobData: JobData): Promise<{
  generalQuestions: string[];
  technicalQuestions: string[];
}> => {
  try {
    console.log('🤖 Generating interview questions for:', jobData.title);

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
            content: 'You are an expert interviewer for tech companies. Generate realistic and thoughtful interview questions. Return your response as JSON with two arrays: "generalQuestions" and "technicalQuestions".'
          },
          {
            role: 'user',
            content: `Generate interview questions for a ${jobData.title} position at ${jobData.company}.

Job Requirements:
${jobData.requirements.slice(0, 5).join('\n')}

Key Skills:
${jobData.skills.slice(0, 8).join(', ')}

Return ONLY valid JSON (no markdown, no code blocks) in this format:
{
  "generalQuestions": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "technicalQuestions": ["technical question 1", "technical question 2", "technical question 3", "technical question 4", "technical question 5"]
}

Make the questions specific to this role and company. General questions should focus on motivation, experience, and soft skills. Technical questions should target the key skills listed above.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const jsonString = data.choices[0].message.content.trim();

    // Parse the JSON response
    const questions = JSON.parse(jsonString);

    console.log('✅ Interview questions generated successfully');

    return {
      generalQuestions: questions.generalQuestions || [],
      technicalQuestions: questions.technicalQuestions || []
    };
  } catch (error: any) {
    console.error('❌ Failed to generate interview questions:', error);
    throw new Error(error.message || 'Failed to generate interview questions');
  }
};

/**
 * Export functions for use in components
 */
export default {
  analyzeResumeWithAI,
  scrapeJobDescription,
  extractJobDataFromText,
  optimizeResumeWithAI,
  generateOptimizedPDF,
  generateInterviewerQuestions,
};
