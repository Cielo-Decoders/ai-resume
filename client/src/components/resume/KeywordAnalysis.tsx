import React, { useState } from 'react';
import { AlertCircle, Star, Check, Zap, Sparkles, CheckCircle, X } from 'lucide-react';
import { ActionableKeyword } from '../../types';

interface KeywordAnalysisProps {
  missingKeywords: string[];
  suggestedKeywords: string[];
  actionableKeywords?: ActionableKeyword[];
  onKeywordsSelected?: (selectedKeywords: ActionableKeyword[]) => void;
  onOptimizeResume?: (selectedKeywords: ActionableKeyword[]) => void;
  isOptimizing?: boolean;
  clearSelections?: boolean;
  jobTitle?: string;
  company?: string;
}

const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({
  missingKeywords,
  suggestedKeywords,
  actionableKeywords = [],
  onKeywordsSelected,
  onOptimizeResume,
  isOptimizing = false,
  clearSelections = false,
  jobTitle = '',
  company = '',
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const buttonSectionRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (clearSelections) {
      setSelectedKeywords(new Set());
      setShowOptimizeModal(false);
    }
  }, [clearSelections]);

  React.useEffect(() => {
    if (selectedKeywords.size > 0 && buttonSectionRef.current) {
      setTimeout(() => {
        buttonSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 150);
    }
  }, [selectedKeywords.size]);

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);

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
    setShowOptimizeModal(false);
  };

  const handleCloseModal = () => {
    setShowOptimizeModal(false);
  };

  const handleOptimize = () => {
    const selected = actionableKeywords.filter(k => selectedKeywords.has(k.keyword));
    if (onOptimizeResume) {
      onOptimizeResume(selected);
    }
    setShowOptimizeModal(false); // Close modal after optimization starts
  };

  const handleShowModal = () => {
    if (selectedKeywords.size > 0) {
      setShowOptimizeModal(true);
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
      {showOptimizeModal && selectedKeywords.size > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform animate-fadeIn">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    Optimize Your Resume
                  </h3>
                  {(jobTitle || company) && (
                    <div className="text-lg font-bold italic mt-2 space-y-0" style={{ color: '#FE7F2D' }}>
                      {jobTitle && company && (
                        <p>
                          for <span>{jobTitle}</span> at <span>{company}</span>
                        </p>
                      )}
                      {jobTitle && !company && (
                        <p>
                          for <span>{jobTitle}</span>
                        </p>
                      )}
                      {!jobTitle && company && (
                        <p>
                          at <span>{company}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowOptimizeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-indigo-900 mb-1">
                        {selectedKeywords.size} skill{selectedKeywords.size > 1 ? 's' : ''} selected
                      </p>
                      <p className="text-sm text-indigo-700">
                        Our AI will intelligently integrate these skills into your resume to improve your match score.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected Keywords Preview */}
                <div className="max-h-40 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Selected Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedKeywords).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 transform focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                  >
                    {isOptimizing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Optimized Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    disabled={isOptimizing}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Missing from Your Resume
          </h3>

          <p className="text-gray-500 mb-3">
            These skills appear in the job description but are not found in your resume. Adding these relevant skills would significantly improve how well your resume matches this role.
          </p>

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
          <p className="text-gray-500 mb-3">
            These job-description terms already appear in your resume.
            </p>
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
            <p className="text-gray-500 text-sm">No matching terms found.</p>
          )}
        </div>

      </div>

      {actionableKeywords.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Job-Relevant Skills & Terms to Add To Optimize Resume
            </h3>
            <div className="flex gap-3">
              <button
                onClick={selectAll}
                aria-label="Select all keywords"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm md:text-base font-semibold rounded-lg shadow-lg hover:scale-105 transform transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              >
                <Check className="w-4 h-4" />
                Select All
              </button>

              <button
                onClick={clearSelection}
                aria-label="Clear selected keywords"
                className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 text-sm md:text-base font-semibold rounded-lg hover:bg-gray-50 hover:scale-105 transform transition-all shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
              >
                <Zap className="w-4 h-4 text-indigo-600" />
                Clear
              </button>
            </div>

          </div>

          <p className="text-sm text-gray-600 mb-4">
            Click to select these role specific skills you want to add to your resume. These are actionable skills and technologies specific to this role filtered by AI.
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
            <div ref={buttonSectionRef} className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex items-left justify-left gap-2 text-indigo-700 bg-indigo-50 rounded-lg p-3 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {selectedKeywords.size} skill{selectedKeywords.size > 1 ? 's' : ''} selected for resume optimization.
                </span>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleShowModal}
                  disabled={isOptimizing}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-10 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-105 transform focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                >
                  <Sparkles className="w-6 h-6" />
                  Continue to Optimize
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KeywordAnalysis;
