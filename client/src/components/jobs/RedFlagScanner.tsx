import React, { useState } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, ShieldQuestion,
  AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp,
  CheckCircle, MessageCircle, HelpCircle, X
} from 'lucide-react';
import { RedFlagResult, RedFlag } from '../../types';

interface RedFlagScannerProps {
  result: RedFlagResult;
  onDismiss?: () => void;
}

const SEVERITY_CONFIG = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    label: 'High',
    accentBar: 'bg-red-500',
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertCircle,
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Medium',
    accentBar: 'bg-amber-500',
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Low',
    accentBar: 'bg-blue-500',
  },
};

const VERDICT_CONFIG: Record<string, {
  scoreColor: string;
  scoreBg: string;
  icon: React.ElementType;
  badgeColor: string;
}> = {
  low: {
    scoreColor: 'text-emerald-700',
    scoreBg: 'bg-emerald-50',
    icon: ShieldCheck,
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  medium: {
    scoreColor: 'text-amber-700',
    scoreBg: 'bg-amber-50',
    icon: ShieldQuestion,
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  high: {
    scoreColor: 'text-red-700',
    scoreBg: 'bg-red-50',
    icon: ShieldAlert,
    badgeColor: 'bg-red-100 text-red-700',
  },
};

const RedFlagScanner: React.FC<RedFlagScannerProps> = ({ result, onDismiss }) => {
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set());
  const [showQuestions, setShowQuestions] = useState(false);

  const getScoreColors = (score: number) => {
    if (score >= 70) return { ring: 'ring-emerald-300', text: 'text-emerald-600' };
    if (score >= 50) return { ring: 'ring-amber-300', text: 'text-amber-600' };
    return { ring: 'ring-red-300', text: 'text-red-600' };
  };

  const scoreColors = getScoreColors(result.score);

  const toggleFlag = (id: string) => {
    const next = new Set(expandedFlags);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedFlags(next);
  };

  const vConfig = VERDICT_CONFIG[result.overallRisk] || VERDICT_CONFIG.medium;
  const VerdictIcon = vConfig.icon;

  const highCount = result.flags.filter(f => f.severity === 'high').length;
  const mediumCount = result.flags.filter(f => f.severity === 'medium').length;
  const lowCount = result.flags.filter(f => f.severity === 'low').length;

  // Sort flags: high → medium → low
  const sortedFlags = [...result.flags].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-indigo-900 text-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Job Posting Risk Scan</h3>
              <p className="text-white/80 text-sm">AI-powered analysis of this listing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Score circle */}
            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full bg-white/20 ring-2 ${scoreColors.ring}`}>
              <span className="text-2xl font-bold leading-none">{result.score}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">Score</span>
            </div>
            {onDismiss && (
              <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verdict bar */}
      <div className={`px-5 py-3 ${vConfig.scoreBg} border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <VerdictIcon className={`w-5 h-5 ${vConfig.scoreColor}`} />
          <span className={`font-bold ${vConfig.scoreColor}`}>{result.verdict}</span>
          {result.summary && (
            <span className="text-gray-600 text-sm hidden sm:inline">— {result.summary}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {highCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              {highCount} High
            </span>
          )}
          {mediumCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              {mediumCount} Medium
            </span>
          )}
          {lowCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {lowCount} Low
            </span>
          )}
          {result.flags.length === 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              No flags found
            </span>
          )}
        </div>
      </div>

      {/* Mobile summary */}
      {result.summary && (
        <div className="sm:hidden px-5 py-3 text-sm text-gray-600 border-b bg-gray-50">
          {result.summary}
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Flags */}
        {sortedFlags.length > 0 && (
          <div className="space-y-2">
            {sortedFlags.map((flag: RedFlag, idx: number) => {
              const config = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.low;
              const FlagIcon = config.icon;
              const isExpanded = expandedFlags.has(flag.id || String(idx));

              return (
                <div
                  key={flag.id || idx}
                  className={`rounded-lg border ${config.border} overflow-hidden transition-all`}
                >
                  {/* Left accent bar */}
                  <div className="flex">
                    <div className={`w-1 ${config.accentBar} flex-shrink-0`} />
                    <div className="flex-1">
                      <button
                        onClick={() => toggleFlag(flag.id || String(idx))}
                        className={`w-full text-left p-3 flex items-start gap-3 hover:${config.bg} transition-colors`}
                      >
                        <FlagIcon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800 text-sm">{flag.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${config.badge}`}>
                              {config.label}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className={`px-3 pb-3 pl-11 space-y-2 ${config.bg}`}>
                          <p className="text-sm text-gray-700">{flag.reason}</p>
                          {flag.evidence && (
                            <div className="text-xs text-gray-500 bg-white/80 rounded px-3 py-2 border border-gray-200 italic">
                              "{flag.evidence}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Positives */}
        {result.positives && result.positives.length > 0 && (
          <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
            <h4 className="font-semibold text-emerald-800 text-sm flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" />
              Positive Signals
            </h4>
            <ul className="space-y-1">
              {result.positives.map((pos, idx) => (
                <li key={idx} className="text-sm text-emerald-700 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  {pos}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions to Ask */}
        {result.questionsToAsk && result.questionsToAsk.length > 0 && (
          <div>
            <button
              onClick={() => setShowQuestions(!showQuestions)}
              className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <span className="font-semibold text-indigo-800 text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Questions to Ask the Recruiter ({result.questionsToAsk.length})
              </span>
              {showQuestions ? (
                <ChevronUp className="w-4 h-4 text-indigo-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {showQuestions && (
              <div className="mt-2 space-y-2 pl-2">
                {result.questionsToAsk.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{q}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RedFlagScanner;
