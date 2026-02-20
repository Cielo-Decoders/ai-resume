import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KeywordAnalysis from '../KeywordAnalysis';
import { ActionableKeyword } from '../../../types';

// ── Mock scrollIntoView (not implemented in jsdom) ───────────────────────────
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const makeKeyword = (overrides: Partial<ActionableKeyword> = {}): ActionableKeyword => ({
  keyword: 'React',
  category: 'Technical Skill',
  priority: 'medium',
  ...overrides,
});

const defaultProps = {
  missingKeywords: [],
  suggestedKeywords: [],
  actionableKeywords: [],
};

const renderComponent = (props: Partial<React.ComponentProps<typeof KeywordAnalysis>> = {}) =>
  render(<KeywordAnalysis {...defaultProps} {...props} />);

// ─────────────────────────────────────────────────────────────────────────────
// Missing & Suggested keyword display
// ─────────────────────────────────────────────────────────────────────────────
describe('KeywordAnalysis – missing / suggested keyword sections', () => {
  it('shows "No missing keywords found!" when missing list is empty', () => {
    renderComponent({ missingKeywords: [] });
    expect(screen.getByText('No missing keywords found!')).toBeInTheDocument();
  });

  it('renders each missing keyword with red styling', () => {
    renderComponent({ missingKeywords: ['Docker', 'Kubernetes'] });

    const dockerEl = screen.getByText('Docker');
    expect(dockerEl).toBeInTheDocument();
    expect(dockerEl).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('shows "No matching terms found." when suggested list is empty', () => {
    renderComponent({ suggestedKeywords: [] });
    expect(screen.getByText('No matching terms found.')).toBeInTheDocument();
  });

  it('renders each suggested keyword with green styling', () => {
    renderComponent({ suggestedKeywords: ['Python', 'SQL'] });

    const pythonEl = screen.getByText('Python');
    expect(pythonEl).toBeInTheDocument();
    expect(pythonEl).toHaveClass('bg-green-100', 'text-green-700');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCategoryColor – via rendered button class
// ─────────────────────────────────────────────────────────────────────────────
describe('getCategoryColor', () => {
  const categoryMap: [string, string][] = [
    ['Technical Skill', 'bg-blue-100'],
    ['Tool', 'bg-purple-100'],
    ['Methodology', 'bg-green-100'],
    ['Domain Knowledge', 'bg-orange-100'],
    ['Soft Skill', 'bg-pink-100'],
    ['Skill', 'bg-indigo-100'],
  ];

  categoryMap.forEach(([category, expectedClass]) => {
    it(`category "${category}" renders button with ${expectedClass}`, () => {
      renderComponent({
        actionableKeywords: [makeKeyword({ keyword: 'TestKw', category })],
      });

      const btn = screen.getByRole('button', { name: /TestKw/ });
      expect(btn).toHaveClass(expectedClass);
    });
  });

  it('unknown category falls back to bg-gray-100', () => {
    renderComponent({
      actionableKeywords: [makeKeyword({ keyword: 'TestKw', category: 'Unknown' })],
    });

    const btn = screen.getByRole('button', { name: /TestKw/ });
    expect(btn).toHaveClass('bg-gray-100');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPriorityBadge
// ─────────────────────────────────────────────────────────────────────────────
describe('getPriorityBadge', () => {
  it('renders "High" badge for high priority', () => {
    renderComponent({
      actionableKeywords: [makeKeyword({ priority: 'high' })],
    });

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('does NOT render "High" badge for medium priority', () => {
    renderComponent({
      actionableKeywords: [makeKeyword({ priority: 'medium' })],
    });

    expect(screen.queryByText('High')).not.toBeInTheDocument();
  });

  it('does NOT render "High" badge for low priority', () => {
    renderComponent({
      actionableKeywords: [makeKeyword({ priority: 'low' })],
    });

    expect(screen.queryByText('High')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// toggleKeyword
// ─────────────────────────────────────────────────────────────────────────────
describe('toggleKeyword', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clicking an unselected keyword selects it (button gets bg-indigo-600)', () => {
    renderComponent({
      actionableKeywords: [makeKeyword({ keyword: 'TypeScript' })],
    });

    const btn = screen.getByRole('button', { name: /TypeScript/ });
    act(() => { userEvent.click(btn); jest.runAllTimers(); });

    expect(btn).toHaveClass('bg-indigo-600');
  });

  it('clicking a selected keyword deselects it (reverts to category class)', () => {
    renderComponent({
      actionableKeywords: [makeKeyword({ keyword: 'TypeScript', category: 'Technical Skill' })],
    });

    const btn = screen.getByRole('button', { name: /TypeScript/ });
    act(() => { userEvent.click(btn); jest.runAllTimers(); }); // select
    act(() => { userEvent.click(btn); jest.runAllTimers(); }); // deselect

    expect(btn).toHaveClass('bg-blue-100');
    expect(btn).not.toHaveClass('bg-indigo-600');
  });

  it('calls onKeywordsSelected with selected keywords after toggle', () => {
    const onKeywordsSelected = jest.fn();
    const kw = makeKeyword({ keyword: 'Docker', category: 'Tool' });

    renderComponent({
      actionableKeywords: [kw],
      onKeywordsSelected,
    });

    const btn = screen.getByRole('button', { name: /Docker/ });
    act(() => { userEvent.click(btn); jest.runAllTimers(); });

    expect(onKeywordsSelected).toHaveBeenCalledWith([kw]);
  });

  it('calls onKeywordsSelected with empty array after deselection', () => {
    const onKeywordsSelected = jest.fn();
    const kw = makeKeyword({ keyword: 'Docker' });

    renderComponent({ actionableKeywords: [kw], onKeywordsSelected });

    const btn = screen.getByRole('button', { name: /Docker/ });
    act(() => { userEvent.click(btn); jest.runAllTimers(); }); // select
    onKeywordsSelected.mockClear();

    act(() => { userEvent.click(btn); jest.runAllTimers(); }); // deselect

    expect(onKeywordsSelected).toHaveBeenCalledWith([]);
  });

  it('updates the selected-count display after toggle', () => {
    renderComponent({
      actionableKeywords: [
        makeKeyword({ keyword: 'React' }),
        makeKeyword({ keyword: 'Node.js', category: 'Tool' }),
      ],
    });

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /React/ }));
      jest.runAllTimers();
    });

    expect(screen.getByText(/1 skill selected/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// selectAll / clearSelection
// ─────────────────────────────────────────────────────────────────────────────
describe('selectAll / clearSelection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const keywords: ActionableKeyword[] = [
    makeKeyword({ keyword: 'Python' }),
    makeKeyword({ keyword: 'Django', category: 'Tool' }),
  ];

  it('Select All selects every keyword', () => {
    renderComponent({ actionableKeywords: keywords });

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /select all/i }));
      jest.runAllTimers();
    });

    expect(screen.getByText(/2 skills selected/)).toBeInTheDocument();
  });

  it('Select All fires onKeywordsSelected with all keywords', () => {
    const onKeywordsSelected = jest.fn();
    renderComponent({ actionableKeywords: keywords, onKeywordsSelected });

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /select all/i }));
      jest.runAllTimers();
    });

    expect(onKeywordsSelected).toHaveBeenLastCalledWith(keywords);
  });

  it('Clear deselects all keywords', () => {
    const onKeywordsSelected = jest.fn();
    renderComponent({ actionableKeywords: keywords, onKeywordsSelected });

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /select all/i }));
      jest.runAllTimers();
    });
    onKeywordsSelected.mockClear();

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /Clear/ }));
      jest.runAllTimers();
    });

    expect(onKeywordsSelected).toHaveBeenCalledWith([]);
    expect(screen.queryByText(/skills selected/)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// clearSelections prop effect
// ─────────────────────────────────────────────────────────────────────────────
describe('clearSelections prop', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('resets selection when clearSelections becomes true', () => {
    const kw = makeKeyword({ keyword: 'Vue' });
    const { rerender } = renderComponent({
      actionableKeywords: [kw],
      clearSelections: false,
    });

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /Vue/ }));
      jest.runAllTimers();
    });
    expect(screen.getByText(/1 skill selected/)).toBeInTheDocument();

    act(() => {
      rerender(
        <KeywordAnalysis
          {...defaultProps}
          actionableKeywords={[kw]}
          clearSelections={true}
        />
      );
      jest.runAllTimers();
    });

    expect(screen.queryByText(/skill selected/)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Optimize modal flow
// ─────────────────────────────────────────────────────────────────────────────
describe('Optimize modal flow', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('"Continue to Optimize" button is visible only after selecting keywords', () => {
    renderComponent({
      actionableKeywords: [makeKeyword({ keyword: 'Rust' })],
    });

    expect(screen.queryByText('Continue to Optimize')).not.toBeInTheDocument();

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /Rust/ }));
      jest.runAllTimers();
    });

    expect(screen.getByText('Continue to Optimize')).toBeInTheDocument();
  });

  it('clicking "Continue to Optimize" opens the modal', () => {
    renderComponent({
      actionableKeywords: [makeKeyword({ keyword: 'Rust' })],
    });

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /Rust/ }));
      jest.runAllTimers();
    });
    act(() => {
      userEvent.click(screen.getByText('Continue to Optimize'));
      jest.runAllTimers();
    });

    expect(screen.getByText('Generate Optimized Resume')).toBeInTheDocument();
  });

  it('modal shows correct selected keyword count', () => {
    const kws = [
      makeKeyword({ keyword: 'Rust' }),
      makeKeyword({ keyword: 'Zig', category: 'Tool' }),
    ];
    renderComponent({ actionableKeywords: kws });

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /Rust/ }));
      jest.runAllTimers();
    });
    act(() => {
      userEvent.click(screen.getByRole('button', { name: /Zig/ }));
      jest.runAllTimers();
    });
    act(() => {
      userEvent.click(screen.getByText('Continue to Optimize'));
      jest.runAllTimers();
    });

    // Modal header shows exactly "2 skills selected" (not the main badge which has extra text)
    expect(screen.getByText('2 skills selected', { exact: true })).toBeInTheDocument();
  });

  it('clicking "Generate Optimized Resume" calls onOptimizeResume with selected keywords', () => {
    const onOptimizeResume = jest.fn();
    const kw = makeKeyword({ keyword: 'Rust' });
    renderComponent({ actionableKeywords: [kw], onOptimizeResume });

    act(() => {
      userEvent.click(screen.getByRole('button', { name: /Rust/ }));
      jest.runAllTimers();
    });
    act(() => {
      userEvent.click(screen.getByText('Continue to Optimize'));
      jest.runAllTimers();
    });
    act(() => {
      userEvent.click(screen.getByText('Generate Optimized Resume'));
      jest.runAllTimers();
    });

    expect(onOptimizeResume).toHaveBeenCalledWith([kw]);
  });
});
