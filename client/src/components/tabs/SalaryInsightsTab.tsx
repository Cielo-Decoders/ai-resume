import React from 'react';
import { DollarSign, CheckCircle } from 'lucide-react';
import { AnalysisResults } from '../../types/index';

interface SalaryInsightsTabProps {
  analysisResults: AnalysisResults;
}

const SalaryInsightsTab: React.FC<SalaryInsightsTabProps> = ({ analysisResults }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Salary Insights for {analysisResults.jobMatch.title}
        </h2>

        {/* Salary Range Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
            <p className="text-sm text-gray-600 mb-2">This Job</p>
            <p className="text-2xl font-bold text-blue-700">
              {analysisResults.salaryInsights.estimatedSalary}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Market Average</p>
            <p className="text-2xl font-bold text-green-700">
              {analysisResults.salaryInsights.marketAverage}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
            <p className="text-sm text-gray-600 mb-2">Top 10%</p>
            <p className="text-2xl font-bold text-purple-700">
              {analysisResults.salaryInsights.topPercentile}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200">
            <p className="text-sm text-gray-600 mb-2">Your Estimate</p>
            <p className="text-2xl font-bold text-orange-700">
              {analysisResults.salaryInsights.yourEstimate}
            </p>
          </div>
        </div>

        {/* Factors */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Factors Affecting Your Salary
          </h3>
          <ul className="space-y-2">
            {analysisResults.salaryInsights.factors.map((factor: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SalaryInsightsTab;
