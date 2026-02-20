import React from 'react';
import { render, screen } from '@testing-library/react';
import ScoreCards from '../ScoreCards';

// Helper that renders with distinct scores so each card is uniquely queryable
const renderScoreCards = (
  overallScore: number,
  atsCompatibility: number,
  keywordMatch: number,
  formatting: number
) =>
  render(
    <ScoreCards
      overallScore={overallScore}
      atsCompatibility={atsCompatibility}
      keywordMatch={keywordMatch}
      formatting={formatting}
    />
  );

// ─────────────────────────────────────────────────────────────────────────────
// Card labels
// ─────────────────────────────────────────────────────────────────────────────
describe('ScoreCards – labels', () => {
  it('renders all four card labels', () => {
    renderScoreCards(80, 75, 65, 55);

    expect(screen.getByText('Overall Score')).toBeInTheDocument();
    expect(screen.getByText('ATS Compatible')).toBeInTheDocument();
    expect(screen.getByText('Keyword Match')).toBeInTheDocument();
    expect(screen.getByText('Formatting')).toBeInTheDocument();
  });

  it('renders the percentage value for each prop', () => {
    renderScoreCards(90, 72, 61, 48);

    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('61%')).toBeInTheDocument();
    expect(screen.getByText('48%')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getScoreColor – tested via rendered className
// ─────────────────────────────────────────────────────────────────────────────
describe('ScoreCards – score colour thresholds (getScoreColor)', () => {
  it('score >= 80 → text-green-600', () => {
    renderScoreCards(80, 80, 80, 80);

    // All four percentages should render green
    ['80%'].forEach(() => {
      const elements = screen.getAllByText('80%');
      elements.forEach(el => expect(el).toHaveClass('text-green-600'));
    });
  });

  it('score 100 → text-green-600', () => {
    renderScoreCards(100, 0, 0, 0);
    expect(screen.getByText('100%')).toHaveClass('text-green-600');
  });

  it('score 60 → text-yellow-600', () => {
    renderScoreCards(60, 0, 0, 0);
    expect(screen.getByText('60%')).toHaveClass('text-yellow-600');
  });

  it('score 79 → text-yellow-600', () => {
    renderScoreCards(79, 0, 0, 0);
    expect(screen.getByText('79%')).toHaveClass('text-yellow-600');
  });

  it('score 59 → text-red-600', () => {
    renderScoreCards(59, 0, 0, 0);
    expect(screen.getByText('59%')).toHaveClass('text-red-600');
  });

  it('score 0 → text-red-600', () => {
    renderScoreCards(0, 0, 0, 0);
    // Multiple 0% elements — all should be red
    const elements = screen.getAllByText('0%');
    elements.forEach(el => expect(el).toHaveClass('text-red-600'));
  });

  it('each card independently determines its own colour', () => {
    renderScoreCards(85, 55, 70, 40);

    expect(screen.getByText('85%')).toHaveClass('text-green-600');
    expect(screen.getByText('55%')).toHaveClass('text-red-600');
    expect(screen.getByText('70%')).toHaveClass('text-yellow-600');
    expect(screen.getByText('40%')).toHaveClass('text-red-600');
  });
});
