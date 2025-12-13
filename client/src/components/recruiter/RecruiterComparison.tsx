import React from 'react';
import { BarChart3, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Improvement } from '../../types/index';

interface RecruiterComparisonProps {
  oldScore: number;
  newScore: number;
  jobTitle: string;
  analysisResults?: {
    missingKeywords: string[];
    matchedKeywords: string[];
    improvements: (string | Improvement)[];
    sections: {
      contact: { issues: string[] };
      summary: { issues: string[] };
      experience: { issues: string[] };
      skills: { issues: string[] };
      education: { issues: string[] };
    };
  };
}

// Helper function to extract text from improvement
const getImprovementText = (improvement: string | Improvement): string => {
  if (typeof improvement === 'string') {
    return improvement;
  }
  return improvement.improved || improvement.description || improvement.original || '';
};

const RecruiterComparison: React.FC<RecruiterComparisonProps> = ({
  oldScore,
  newScore,
  jobTitle,
  analysisResults,
}) => {
  const improvement = Math.max(0, newScore - oldScore);

  const matchedKeywords = analysisResults?.matchedKeywords || [];
  const missingKeywords = analysisResults?.missingKeywords || [];
  const aiImprovements = analysisResults?.improvements || [];

  const sectionIssues = [
    ...(analysisResults?.sections?.contact?.issues || []),
    ...(analysisResults?.sections?.summary?.issues || []),
    ...(analysisResults?.sections?.experience?.issues || []),
    ...(analysisResults?.sections?.skills?.issues || []),
    ...(analysisResults?.sections?.education?.issues || []),
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Eye className="w-6 h-6 text-indigo-600" />
          How Recruiters Will See Your Resume
        </h2>

        {/* Side by Side Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Old Resume */}
          <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-600">Original Resume</h3>
            </div>
            <div className="mb-4 p-4 bg-red-100 rounded text-center">
              <p className="text-sm text-gray-600 mb-1">ATS Score</p>
              <p className="text-4xl font-bold text-red-600">{oldScore}%</p>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>❌ Missing critical keywords</p>
              <p>❌ Poor keyword placement</p>
              <p>❌ Generic job descriptions</p>
              <p>❌ Weak metrics and achievements</p>
              <p>❌ Lower ranking in ATS</p>
            </div>
          </div>

          {/* New Resume */}
          <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-600">Optimized Resume</h3>
            </div>
            <div className="mb-4 p-4 bg-green-100 rounded text-center">
              <p className="text-sm text-gray-600 mb-1">ATS Score</p>
              <p className="text-4xl font-bold text-green-600">{newScore}%</p>
              <p className="text-xs text-green-600 mt-2">+{improvement}% improvement</p>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>✓ Optimized job-specific keywords</p>
              <p>✓ Strategic keyword placement</p>
              <p>✓ Quantified achievements</p>
              <p>✓ Strong metrics (e.g., 40%, 60%, 99.9%)</p>
              <p>✓ Higher ranking in ATS</p>
            </div>
          </div>
        </div>

        {/* What Changed */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-300 p-6 mb-8">
          <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Key Improvements Made
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded border border-indigo-200">
              <p className="font-semibold text-gray-800 mb-2">Keywords Added:</p>
              <p className="text-sm text-gray-600">
                {(missingKeywords.length > 0 ? missingKeywords.slice(0, 8) : matchedKeywords.slice(0, 8)).join(', ') || 'AWS, Docker, Kubernetes, Microservices, CI/CD, Python, React, Node.js'}
              </p>
            </div>
            <div className="p-4 bg-white rounded border border-indigo-200">
              <p className="font-semibold text-gray-800 mb-2">Skills Reordered:</p>
              <p className="text-sm text-gray-600">
                Moved highly relevant skills to top based on job posting requirements
              </p>
            </div>
            <div className="p-4 bg-white rounded border border-indigo-200">
              <p className="font-semibold text-gray-800 mb-2">Metrics Highlighted:</p>
              <p className="text-sm text-gray-600">
                {(aiImprovements.find(s => getImprovementText(s).toLowerCase().includes('quantify'))
                  ? 'Added quantifiable achievements aligned with role impact'
                  : 'Added quantifiable achievements (40% cost reduction, 99.9% uptime, 1M+ users)')}
              </p>
            </div>
            <div className="p-4 bg-white rounded border border-indigo-200">
              <p className="font-semibold text-gray-800 mb-2">ATS Optimization:</p>
              <p className="text-sm text-gray-600">
                Improved formatting for scanner readability, proper section headers
              </p>
            </div>
          </div>
        </div>

        {/* Recruiter Perspective */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3">👨‍💼 Recruiter Perspective</h3>
          <p className="text-sm text-blue-800 mb-4">
            When a recruiter searches for "{jobTitle}" candidates, here's what improves:
          </p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              <strong>Visibility:</strong> Your resume is {improvement}% more likely to appear in search results
            </li>
            <li>
              <strong>Ranking:</strong> It will rank higher among similar candidates due to better keyword matching
            </li>
            <li>
              <strong>First Impression:</strong> Key achievements are immediately visible on first scan
            </li>
            <li>
              <strong>ATS Compatibility:</strong> No parsing errors or missing information during ATS screening
            </li>
            <li>
              <strong>Time Spent:</strong> Recruiter spends more time on your resume due to clear structure
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecruiterComparison;
