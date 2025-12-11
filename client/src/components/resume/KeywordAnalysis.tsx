import React from 'react';
import { AlertCircle, Star } from 'lucide-react';

interface KeywordAnalysisProps {
  missingKeywords: string[];
  suggestedKeywords: string[];
}

const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({
  missingKeywords,
  suggestedKeywords,
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Missing from Your Resume
        </h3>
        <div className="flex flex-wrap gap-2">
          {missingKeywords.map((keyword, idx) => (
            <span
              key={idx}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold"
            >
              {keyword}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Add these to improve your match score to 95%+
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Recommended Keywords
        </h3>
        <div className="flex flex-wrap gap-2">
          {suggestedKeywords.map((keyword, idx) => (
            <span
              key={idx}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold"
            >
              {keyword}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Industry-relevant terms for this role
        </p>
      </div>
    </div>
  );
};

export default KeywordAnalysis;

