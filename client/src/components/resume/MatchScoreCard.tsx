import React, { useState } from 'react';
import {
  Target, ChevronDown, ChevronUp, CheckCircle, XCircle,
  TrendingUp, Lightbulb, BarChart3, Layers, Zap
} from 'lucide-react';
import { KeywordAnalysisResult } from '../../types';

interface MatchScoreCardProps {
  result: KeywordAnalysisResult;
}

const SCORE_CONFIG: Record<string, {
  scoreColor: string;
  scoreBg: string;
  badgeColor: string;
  label: string;
  description: string;
}> = {
  excellent: {
    scoreColor: 'text-emerald-700',
    scoreBg: 'bg-emerald-50',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    label: 'Excellent Match',
    description: 'Your resume aligns very well with this role',
  },
  good: {
    scoreColor: 'text-indigo-700',
    scoreBg: 'bg-indigo-50',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    label: 'Good Match',
    description: 'Solid alignment with room for improvement',
  },
  fair: {
    scoreColor: 'text-amber-700',
    scoreBg: 'bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-700',
    label: 'Fair Match',
    description: 'Significant gaps — optimization recommended',
  },
  weak: {
    scoreColor: 'text-red-700',
    scoreBg: 'bg-red-50',
    badgeColor: 'bg-red-100 text-red-700',
    label: 'Weak Match',
    description: 'Major gaps — heavy optimization needed',
  },
};

function getScoreLevel(score: number) {
  if (score >= 75) return 'excellent';
  if (score >= 55) return 'good';
  if (score >= 35) return 'fair';
  return 'weak';
}

function getScoreColors(score: number) {
  if (score >= 70) return { text: 'text-emerald-600', ring: 'ring-emerald-300', bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-green-600' };
  if (score >= 50) return { text: 'text-amber-600', ring: 'ring-amber-300', bg: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' };
  return { text: 'text-red-600', ring: 'ring-red-300', bg: 'bg-red-500', gradient: 'from-red-500 to-rose-600' };
}

interface AccordionSectionProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title, icon: Icon, iconColor, badge, badgeColor, defaultOpen = false, children
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <span className="font-semibold text-gray-800 text-sm flex-1">{title}</span>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
            {badge}
          </span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ result }) => {
  const level = getScoreLevel(result.matchScore);
  const config = SCORE_CONFIG[level];
  const scoreColors = getScoreColors(result.matchScore);

  const matchingPhrases = (result.matchingPhrases?.length > 0) ? result.matchingPhrases : (result.matchingKeywords || []);
  const missingPhrases = (result.missingPhrases?.length > 0) ? result.missingPhrases : (result.missingKeywords || []);
  const total = result.totalJobKeywords || (matchingPhrases.length + missingPhrases.length);
  const matchedCount = matchingPhrases.length;
  const missingCount = missingPhrases.length;

  const highPriority = (result.actionableKeywords || []).filter(k => k.priority === 'high');
  const mediumPriority = (result.actionableKeywords || []).filter(k => k.priority === 'medium');
  const lowPriority = (result.actionableKeywords || []).filter(k => k.priority === 'low');

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-indigo-900 text-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Job Match Score</h3>
              <p className="text-white/80 text-sm">AI keyword analysis of your resume vs. this role</p>
            </div>
          </div>
          <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full bg-white/20 ring-2 ${scoreColors.ring}`}>
            <span className="text-xl font-bold leading-none">{result.matchScore}%</span>
          </div>
        </div>
      </div>

      {/* Verdict bar */}
      <div className={`px-5 py-3 ${config.scoreBg} border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${config.scoreColor}`} />
          <span className={`font-bold ${config.scoreColor}`}>{config.label}</span>
          <span className="text-gray-600 text-sm hidden sm:inline">— {config.description}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full font-medium ${config.badgeColor}`}>
            {result.matchScore}%
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            {matchedCount} Matched
          </span>
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
            {missingCount} Missing
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            {total} Total
          </span>
        </div>
      </div>

      {/* Mobile description */}
      <div className="sm:hidden px-5 py-3 text-sm text-gray-600 border-b bg-gray-50">
        {config.description}
      </div>

      {/* Accordion sections */}
      <div className="p-5 space-y-3">
        {/* Score Breakdown */}
        <AccordionSection
          title="How Your Score Was Calculated"
          icon={BarChart3}
          iconColor="text-indigo-600"
          defaultOpen={true}
        >
          <div className="mt-3 space-y-3">
            <p className="text-sm text-gray-600">
              Your score is based on how many job-relevant keywords and phrases from the posting were found in your resume.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Keywords found in resume</span>
                <span className="font-bold text-emerald-700">{matchedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Keywords missing from resume</span>
                <span className="font-bold text-red-600">{missingCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2">
                <span className="text-gray-600">Total keywords extracted from job</span>
                <span className="font-bold text-gray-800">{total}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2">
                <span className="text-gray-700 font-medium">Formula</span>
                <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  ({matchedCount} / {total}) × 100 = {result.matchScore}%
                </span>
              </div>
            </div>
            {/* Visual bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${scoreColors.gradient}`}
                  style={{ width: `${Math.min(result.matchScore, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Matched Keywords */}
        {matchingPhrases.length > 0 && (
          <AccordionSection
            title="Matched Keywords"
            icon={CheckCircle}
            iconColor="text-emerald-600"
            badge={`${matchedCount}`}
            badgeColor="bg-emerald-100 text-emerald-700"
          >
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-2">
                These keywords from the job posting were found in your resume:
              </p>
              <div className="flex flex-wrap gap-2">
                {matchingPhrases.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Missing Keywords */}
        {missingPhrases.length > 0 && (
          <AccordionSection
            title="Missing Keywords"
            icon={XCircle}
            iconColor="text-red-500"
            badge={`${missingCount}`}
            badgeColor="bg-red-100 text-red-700"
          >
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-2">
                These keywords from the job posting were not found in your resume:
              </p>
              <div className="flex flex-wrap gap-2">
                {missingPhrases.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                  >
                    <XCircle className="w-3 h-3" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Priority Breakdown */}
        {result.actionableKeywords && result.actionableKeywords.length > 0 && (
          <AccordionSection
            title="Priority Breakdown"
            icon={Layers}
            iconColor="text-purple-600"
            badge={`${result.actionableKeywords.length} actionable`}
            badgeColor="bg-purple-100 text-purple-700"
          >
            <div className="mt-3 space-y-3">
              <p className="text-sm text-gray-500">
                AI-ranked keywords you should add, sorted by impact on your application:
              </p>
              {highPriority.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold uppercase text-red-700">High Priority</span>
                    <span className="text-xs text-gray-400">— Must include</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {highPriority.map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        {kw.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {mediumPriority.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold uppercase text-amber-700">Medium Priority</span>
                    <span className="text-xs text-gray-400">— Strongly recommended</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mediumPriority.map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {kw.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {lowPriority.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold uppercase text-blue-700">Low Priority</span>
                    <span className="text-xs text-gray-400">— Nice to have</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lowPriority.map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {kw.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionSection>
        )}

        {/* Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
          <AccordionSection
            title="AI Suggestions"
            icon={Lightbulb}
            iconColor="text-amber-500"
            badge={`${result.suggestions.length}`}
            badgeColor="bg-amber-100 text-amber-700"
          >
            <div className="mt-3 space-y-2">
              {result.suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}
      </div>
    </div>
  );
};

export default MatchScoreCard;
