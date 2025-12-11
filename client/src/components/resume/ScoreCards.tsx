import React from 'react';
import { Award, CheckCircle, FileText, TrendingUp } from 'lucide-react';

interface ScoreCardsProps {
  overallScore: number;
  atsCompatibility: number;
  keywordMatch: number;
  formatting: number;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const ScoreCards: React.FC<ScoreCardsProps> = ({
  overallScore,
  atsCompatibility,
  keywordMatch,
  formatting,
}) => {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 font-semibold">Overall Score</span>
          <Award className="w-5 h-5 text-green-600" />
        </div>
        <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
          {overallScore}%
        </div>
        <p className="text-xs text-gray-600 mt-2">Job-specific match</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 font-semibold">ATS Compatible</span>
          <CheckCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div className={`text-4xl font-bold ${getScoreColor(atsCompatibility)}`}>
          {atsCompatibility}%
        </div>
        <p className="text-xs text-gray-600 mt-2">Parser-friendly</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 font-semibold">Keyword Match</span>
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
        <div className={`text-4xl font-bold ${getScoreColor(keywordMatch)}`}>
          {keywordMatch}%
        </div>
        <p className="text-xs text-gray-600 mt-2">vs. job requirements</p>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 font-semibold">Formatting</span>
          <FileText className="w-5 h-5 text-orange-600" />
        </div>
        <div className={`text-4xl font-bold ${getScoreColor(formatting)}`}>
          {formatting}%
        </div>
        <p className="text-xs text-gray-600 mt-2">Structure quality</p>
      </div>
    </div>
  );
};

export default ScoreCards;

