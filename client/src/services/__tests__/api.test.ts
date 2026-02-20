// jest.mock is hoisted before imports — the factory avoids loading the ESM axios bundle.
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
  },
  post: jest.fn(),
  get: jest.fn(),
}));

import axios from 'axios';
import {
  extractTextFromResume,
  extractJobDataFromText,
  analyzeKeywords,
  optimizeResume,
} from '../api';
import { ActionableKeyword, JobData } from '../../types';

// Typed reference to the mocked post function
const mockPost = axios.post as jest.MockedFunction<typeof axios.post>;

beforeEach(() => {
  mockPost.mockReset();
  if (global.fetch && typeof (global.fetch as any).mockReset === 'function') {
    (global.fetch as any).mockReset();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeFile = (name = 'resume.pdf', type = 'application/pdf'): File =>
  new File(['pdf content'], name, { type });

const makeKeyword = (overrides: Partial<ActionableKeyword> = {}): ActionableKeyword => ({
  keyword: 'Python',
  category: 'Technical Skill',
  priority: 'high',
  ...overrides,
});

const makeJobData = (): JobData => ({
  title: 'Software Engineer',
  company: 'Acme',
  location: 'Austin, TX',
  salary_range: '$100k',
  requirements: ['Python'],
  responsibilities: ['Build APIs'],
  skills: ['Python', 'React'],
  experience_level: 'mid',
  job_type: 'full-time',
  benefits: [],
});

const openAiSuccessResponse = (content: object) => ({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(content) } }],
  }),
  text: jest.fn().mockResolvedValue(''),
});

const openAiErrorResponse = (status: number, errorMessage = 'Error') => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue({ error: { message: errorMessage } }),
  text: jest.fn().mockResolvedValue(JSON.stringify({ error: { message: errorMessage } })),
});

// ─────────────────────────────────────────────────────────────────────────────
// extractTextFromResume
// ─────────────────────────────────────────────────────────────────────────────
describe('extractTextFromResume', () => {
  it('returns response data on success', async () => {
    const mockData = { success: true, text: 'Resume text', textLength: 11 };
    mockPost.mockResolvedValueOnce({ data: mockData });

    const result = await extractTextFromResume(makeFile());

    expect(result).toEqual(mockData);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/extract-text'),
      expect.any(FormData),
      expect.objectContaining({ timeout: 300000 })
    );
  });

  it('throws server error message when response contains error field', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: 'Extraction service unavailable' } },
    });

    await expect(extractTextFromResume(makeFile())).rejects.toThrow(
      'Extraction service unavailable'
    );
  });

  it('throws timeout message on ECONNABORTED', async () => {
    const err = Object.assign(new Error('timeout of 300000ms exceeded'), {
      code: 'ECONNABORTED',
    });
    mockPost.mockRejectedValueOnce(err);

    await expect(extractTextFromResume(makeFile())).rejects.toThrow('Analysis took too long');
  });

  it('re-throws generic network error message', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network Error'));

    await expect(extractTextFromResume(makeFile())).rejects.toThrow('Network Error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractJobDataFromText
// ─────────────────────────────────────────────────────────────────────────────
describe('extractJobDataFromText', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, REACT_APP_OPENAI_API_KEY: 'test-key-123' };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when OpenAI API key is not configured', async () => {
    delete process.env.REACT_APP_OPENAI_API_KEY;

    await expect(extractJobDataFromText('job description')).rejects.toThrow('not configured');
  });

  it('returns parsed job data on success', async () => {
    const jobData = { title: 'Engineer', company: 'Acme', location: 'Remote' };
    (global.fetch as jest.Mock).mockResolvedValueOnce(openAiSuccessResponse(jobData));

    const result = await extractJobDataFromText('We are hiring a Software Engineer at Acme...');

    expect(result).toEqual(jobData);
  });

  it('throws Invalid OpenAI API key on HTTP 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(openAiErrorResponse(401, 'Unauthorized'));

    await expect(extractJobDataFromText('job desc')).rejects.toThrow('Invalid OpenAI API key');
  });

  it('throws rate limit message on HTTP 429', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(openAiErrorResponse(429, 'Too Many Requests'));

    await expect(extractJobDataFromText('job desc')).rejects.toThrow('rate limit exceeded');
  });

  it('throws model not found message on HTTP 404', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(openAiErrorResponse(404, 'Model not found'));

    await expect(extractJobDataFromText('job desc')).rejects.toThrow('model not found');
  });

  it('throws when OpenAI returns invalid JSON content', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'not valid json {{{' } }],
      }),
      text: jest.fn().mockResolvedValue(''),
    });

    await expect(extractJobDataFromText('job desc')).rejects.toThrow('not valid JSON');
  });

  it('throws when OpenAI response is missing choices', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ result: 'no choices here' }),
      text: jest.fn().mockResolvedValue(''),
    });

    await expect(extractJobDataFromText('job desc')).rejects.toThrow(
      'Invalid response structure'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// analyzeKeywords
// ─────────────────────────────────────────────────────────────────────────────
describe('analyzeKeywords', () => {
  it('returns analysis result on success', async () => {
    const mockResult = {
      success: true,
      matchScore: 75,
      missingPhrases: ['Docker'],
      matchingPhrases: ['Python'],
      actionableKeywords: [],
    };
    mockPost.mockResolvedValueOnce({ data: mockResult });

    const result = await analyzeKeywords('resume text here', makeJobData());

    expect(result).toEqual(mockResult);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze-keywords'),
      expect.objectContaining({ resume_text: 'resume text here' }),
      expect.any(Object)
    );
  });

  it('throws the detail field when server returns a detail error', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { detail: 'Resume text is too short' } },
    });

    await expect(analyzeKeywords('hi', makeJobData())).rejects.toThrow(
      'Resume text is too short'
    );
  });

  it('re-throws generic error message', async () => {
    mockPost.mockRejectedValueOnce(new Error('Connection refused'));

    await expect(analyzeKeywords('resume', makeJobData())).rejects.toThrow('Connection refused');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// optimizeResume
// ─────────────────────────────────────────────────────────────────────────────
describe('optimizeResume', () => {
  const keywords = [makeKeyword()];

  it('returns optimization result on success', async () => {
    const mockResult = {
      success: true,
      message: 'Generated successfully',
      optimizedResume: 'Optimized resume text',
      changes: [],
      atsScore: 88,
    };
    mockPost.mockResolvedValueOnce({ data: mockResult });

    const result = await optimizeResume('original resume text', 'job desc', keywords);

    expect(result).toEqual(mockResult);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/optimize-resume'),
      expect.objectContaining({
        original_resume_text: 'original resume text',
        job_description: 'job desc',
        selected_keywords: [{ keyword: 'Python', category: 'Technical Skill', priority: 'high' }],
      }),
      expect.objectContaining({ timeout: 120000 })
    );
  });

  it('throws server message when success is false', async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: false, message: 'AI generation failed' },
    });

    await expect(optimizeResume('original', 'job desc', keywords)).rejects.toThrow(
      'AI generation failed'
    );
  });

  it('throws when optimizedResume is missing from successful response', async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: true, message: 'OK' }, // no optimizedResume field
    });

    await expect(optimizeResume('original', 'job desc', keywords)).rejects.toThrow(
      'No optimized resume returned from server'
    );
  });

  it('throws the detail field from error response', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { detail: 'Token limit exceeded by model' } },
    });

    await expect(optimizeResume('original', 'job desc', keywords)).rejects.toThrow(
      'Token limit exceeded by model'
    );
  });

  it('throws the message field from error response when no detail', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'Internal server error occurred' } },
    });

    await expect(optimizeResume('original', 'job desc', keywords)).rejects.toThrow(
      'Internal server error occurred'
    );
  });

  it('throws timeout message on ECONNABORTED', async () => {
    const err = Object.assign(new Error('timeout of 120000ms exceeded'), {
      code: 'ECONNABORTED',
    });
    mockPost.mockRejectedValueOnce(err);

    await expect(optimizeResume('original', 'job desc', keywords)).rejects.toThrow(
      'Optimization took too long'
    );
  });

  it('formats keywords with category and priority defaults', async () => {
    const kwNoDefaults: ActionableKeyword = { keyword: 'React', category: '', priority: 'medium' };
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        optimizedResume: 'text',
        changes: [],
        atsScore: 80,
      },
    });

    await optimizeResume('original', 'job desc', [kwNoDefaults]);

    const callArgs = mockPost.mock.calls[0][1] as { selected_keywords: any[] };
    expect(callArgs.selected_keywords[0]).toEqual({
      keyword: 'React',
      category: 'Skill', // fallback to 'Skill' when empty
      priority: 'medium',
    });
  });
});
