import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptimizedResumeDisplay from '../OptimizedResumeDisplay';
import { OptimizationResult } from '../../../types';

// ── Mock jsPDF so PDF generation doesn't require browser canvas APIs ─────────
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: { getWidth: () => 215.9, getHeight: () => 279.4 },
    },
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    getTextWidth: jest.fn(() => 50),
    text: jest.fn(),
    line: jest.fn(),
    addPage: jest.fn(),
    splitTextToSize: jest.fn((text: string) => [text]),
    save: jest.fn(),
  })),
}));

// ── scrollIntoView is not implemented in jsdom ───────────────────────────────
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const makeResult = (overrides: Partial<OptimizationResult> = {}): OptimizationResult => ({
  success: true,
  message: 'Resume optimized',
  optimizedResume: 'John Doe\nPython developer',
  changes: [],
  atsScore: 85,
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// getScoreColor (local to OptimizedResumeDisplay)
// ─────────────────────────────────────────────────────────────────────────────
describe('getScoreColor (ATS score badge)', () => {
  it('score >= 80 → text-green-600 and bg-green-100', () => {
    render(<OptimizedResumeDisplay result={makeResult({ atsScore: 85 })} />);

    const span = screen.getByText('ATS Score');
    const badge = span.parentElement!;
    expect(badge).toHaveClass('text-green-600');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('score 100 → green', () => {
    render(<OptimizedResumeDisplay result={makeResult({ atsScore: 100 })} />);

    const badge = screen.getByText('ATS Score').parentElement!;
    expect(badge).toHaveClass('text-green-600');
  });

  it('score 60 → text-yellow-600 and bg-yellow-100', () => {
    render(<OptimizedResumeDisplay result={makeResult({ atsScore: 60 })} />);

    const badge = screen.getByText('ATS Score').parentElement!;
    expect(badge).toHaveClass('text-yellow-600');
    expect(badge).toHaveClass('bg-yellow-100');
  });

  it('score 79 → yellow', () => {
    render(<OptimizedResumeDisplay result={makeResult({ atsScore: 79 })} />);

    const badge = screen.getByText('ATS Score').parentElement!;
    expect(badge).toHaveClass('text-yellow-600');
  });

  it('score < 60 → text-red-600 and bg-red-100', () => {
    render(<OptimizedResumeDisplay result={makeResult({ atsScore: 42 })} />);

    const badge = screen.getByText('ATS Score').parentElement!;
    expect(badge).toHaveClass('text-red-600');
    expect(badge).toHaveClass('bg-red-100');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Changes accordion
// ─────────────────────────────────────────────────────────────────────────────
describe('Changes accordion', () => {
  const resultWithChanges = makeResult({
    changes: [
      {
        section: 'Skills',
        description: 'Added TypeScript to skills section',
        keywordsAdded: ['TypeScript'],
      },
    ],
  });

  it('renders change description when changes are present', () => {
    render(<OptimizedResumeDisplay result={resultWithChanges} />);

    expect(screen.getByText('Added TypeScript to skills section')).toBeInTheDocument();
  });

  it('shows the changes count in the button', () => {
    render(<OptimizedResumeDisplay result={resultWithChanges} />);

    expect(screen.getByText(/Changes Made \(1\)/)).toBeInTheDocument();
  });

  it('hides changes list when accordion is collapsed', () => {
    render(<OptimizedResumeDisplay result={resultWithChanges} />);

    act(() => { userEvent.click(screen.getByText(/Changes Made/)); });

    expect(screen.queryByText('Added TypeScript to skills section')).not.toBeInTheDocument();
  });

  it('shows changes list again when accordion is re-expanded', () => {
    render(<OptimizedResumeDisplay result={resultWithChanges} />);

    act(() => { userEvent.click(screen.getByText(/Changes Made/)); }); // collapse
    act(() => { userEvent.click(screen.getByText(/Changes Made/)); }); // expand

    expect(screen.getByText('Added TypeScript to skills section')).toBeInTheDocument();
  });

  it('does NOT render the changes section when changes array is empty', () => {
    render(<OptimizedResumeDisplay result={makeResult({ changes: [] })} />);

    expect(screen.queryByText(/Changes Made/)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Preview modal & highlightWordDifferences
// ─────────────────────────────────────────────────────────────────────────────
describe('Preview modal', () => {
  it('opens the preview modal when "Preview Resume" is clicked', () => {
    render(<OptimizedResumeDisplay result={makeResult()} />);

    act(() => { userEvent.click(screen.getByText('Preview Resume')); });

    expect(screen.getByText('Resume Preview')).toBeInTheDocument();
  });

  it('closes the modal when the close button is clicked', () => {
    render(<OptimizedResumeDisplay result={makeResult()} />);

    act(() => { userEvent.click(screen.getByText('Preview Resume')); });
    act(() => { userEvent.click(screen.getByText('Close')); });

    expect(screen.queryByText('Resume Preview')).not.toBeInTheDocument();
  });

  it('renders "Download PDF" button', () => {
    render(<OptimizedResumeDisplay result={makeResult()} />);

    // There are two Download PDF buttons (main + modal footer); just check one exists
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  describe('highlightWordDifferences (via preview modal)', () => {
    it('highlights a word that is new in optimized resume', () => {
      // originalResume has "Python developer"
      // optimizedResume has "Python TypeScript developer" → "TypeScript" is new
      const result = makeResult({
        optimizedResume: 'John Doe\nPython TypeScript developer',
        changes: [],
      });

      render(
        <OptimizedResumeDisplay
          result={result}
          originalResume="John Doe\nPython developer"
        />
      );

      act(() => { userEvent.click(screen.getByText('Preview Resume')); });

      // TypeScript should appear inside a <strong> element (highlighted)
      const highlighted = screen.getByText('TypeScript');
      expect(highlighted.tagName).toBe('STRONG');
      expect(highlighted).toHaveClass('text-indigo-900');
      expect(highlighted).toHaveClass('bg-yellow-100');
    });

    it('does NOT highlight a word that exists in the original resume', () => {
      const result = makeResult({
        optimizedResume: 'John Doe\nPython expert',
        changes: [],
      });

      render(
        <OptimizedResumeDisplay
          result={result}
          originalResume="John Doe\nPython expert"
        />
      );

      act(() => { userEvent.click(screen.getByText('Preview Resume')); });

      // "Python" exists in original → should NOT be highlighted as <strong>
      const pythonEl = screen.getByText('Python');
      expect(pythonEl.tagName).not.toBe('STRONG');
    });

    it('renders section headers with font-bold class', () => {
      const result = makeResult({
        optimizedResume: 'John Doe\nEDUCATION\nUniversity of Texas',
        changes: [],
      });

      render(
        <OptimizedResumeDisplay
          result={result}
          originalResume="John Doe\nEDUCATION\nUniversity of Texas"
        />
      );

      act(() => { userEvent.click(screen.getByText('Preview Resume')); });

      const educationEl = screen.getByText('EDUCATION');
      expect(educationEl).toHaveClass('font-bold');
    });

    it('does NOT highlight stop words even if new in optimized text', () => {
      // "the" is a stop word and should not be highlighted even if absent from original
      const result = makeResult({
        optimizedResume: 'Managed the project effectively',
        changes: [],
      });

      render(
        <OptimizedResumeDisplay
          result={result}
          originalResume="Managed project effectively"
        />
      );

      act(() => { userEvent.click(screen.getByText('Preview Resume')); });

      // "the" should NOT be highlighted
      const theEl = screen.getByText('the');
      expect(theEl.tagName).not.toBe('STRONG');
    });
  });
});
