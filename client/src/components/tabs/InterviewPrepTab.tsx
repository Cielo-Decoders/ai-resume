import React from 'react';
import { MessageSquare, BookOpen, Target, Zap, CheckCircle } from 'lucide-react';
import { AnalysisResults } from '../../types/index';

interface InterviewPrepTabProps {
  analysisResults: AnalysisResults;
}

const InterviewPrepTab: React.FC<InterviewPrepTabProps> = ({ analysisResults }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
          Interview Preparation for {analysisResults.jobMatch.title}
        </h2>

        {/* Likely Questions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Likely Interview Questions
          </h3>
          <div className="space-y-3">
            {analysisResults.interviewPrep.likelyQuestions.map((question: string, idx: number) => (
              <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-700 font-medium">
                  {idx + 1}. {question}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Topics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Key Technical Topics to Review
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysisResults.interviewPrep.technicalTopics.map((topic: string, idx: number) => (
              <span
                key={idx}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Preparation Tips */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Preparation Strategy
          </h3>
          <div className="space-y-3">
            {analysisResults.interviewPrep.preparationTips.map((tip: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepTab;
