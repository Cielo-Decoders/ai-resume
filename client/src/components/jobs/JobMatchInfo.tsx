import React from 'react';
import { Target } from 'lucide-react';

interface JobMatchInfoProps {
  title: string;
  company: string;
  matchPercentage: number;
  salaryRange: string;
}

const JobMatchInfo: React.FC<JobMatchInfoProps> = ({
  title,
  company,
  matchPercentage,
  salaryRange,
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
        <Target className="w-6 h-6" />
        Target Position Analysis
      </h3>
      <div className="grid md:grid-cols-4 gap-4">
        <div>
          <p className="text-indigo-100 text-sm">Position</p>
          <p className="text-lg font-semibold">{title}</p>
        </div>
        <div>
          <p className="text-indigo-100 text-sm">Company</p>
          <p className="text-lg font-semibold">{company}</p>
        </div>
        <div>
          <p className="text-indigo-100 text-sm">Match Score</p>
          <p className="text-lg font-semibold">{matchPercentage}%</p>
        </div>
        <div>
          <p className="text-indigo-100 text-sm">Salary Range</p>
          <p className="text-lg font-semibold">{salaryRange}</p>
        </div>
      </div>
    </div>
  );
};

export default JobMatchInfo;

