import React, { useState } from 'react';
import { AlertCircle, Star, Check, Zap } from 'lucide-react';
import { ActionableKeyword } from '../../types';

interface KeywordAnalysisProps {
  missingKeywords: string[];
  suggestedKeywords: string[];
  actionableKeywords?: ActionableKeyword[];
  onKeywordsSelected?: (selectedKeywords: ActionableKeyword[]) => void;
}

const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({
  missingKeywords,
  suggestedKeywords,
  actionableKeywords = [],
  onKeywordsSelected,
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
    
    // Notify parent of selection changes
    if (onKeywordsSelected) {
      const selected = actionableKeywords.filter(k => newSelected.has(k.keyword));
      onKeywordsSelected(selected);
    }
  };

  const selectAll = () => {
    const allKeywords = new Set(actionableKeywords.map(k => k.keyword));
    setSelectedKeywords(allKeywords);
    if (onKeywordsSelected) {
      onKeywordsSelected(actionableKeywords);
    }
  };

  const clearSelection = () => {
    setSelectedKeywords(new Set());
    if (onKeywordsSelected) {
      onKeywordsSelected([]);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Technical Skill': 'bg-blue-100 text-blue-700 border-blue-300',
      'Tool': 'bg-purple-100 text-purple-700 border-purple-300',
      'Methodology': 'bg-green-100 text-green-700 border-green-300',
      'Domain Knowledge': 'bg-orange-100 text-orange-700 border-orange-300',
      'Soft Skill': 'bg-pink-100 text-pink-700 border-pink-300',
      'Skill': 'bg-indigo-100 text-indigo-700 border-indigo-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') {
      return <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">High</span>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Actionable Keywords Section - Main focus */}
      {actionableKeywords.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Recommended Keywords to Add
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Click to select keywords you want to add to your resume. These are actionable skills and technologies filtered by AI.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {actionableKeywords.map((item, idx) => {
              const isSelected = selectedKeywords.has(item.keyword);
              return (
                <button
                  key={idx}
                  onClick={() => toggleKeyword(item.keyword)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all
                    ${isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                      : getCategoryColor(item.category) + ' hover:shadow-md'
                    }
                  `}
                >
                  {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                  {item.keyword}
                  {getPriorityBadge(item.priority)}
                </button>
              );
            })}
          </div>
          
          {selectedKeywords.size > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-700">
                <strong>{selectedKeywords.size}</strong> keyword{selectedKeywords.size > 1 ? 's' : ''} selected for optimization
              </p>
            </div>
          )}
        </div>
      )}

      {/* Original Missing/Matching Keywords Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Missing from Your Resume
          </h3>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {missingKeywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold"
              >
                {keyword}
              </span>
            ))}
          </div>
          {missingKeywords.length === 0 && (
            <p className="text-gray-500 text-sm">No missing keywords found!</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-green-500" />
            Already in Your Resume
          </h3>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {suggestedKeywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold"
              >
                {keyword}
              </span>
            ))}
          </div>
          {suggestedKeywords.length === 0 && (
            <p className="text-gray-500 text-sm">No matching keywords found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordAnalysis;

