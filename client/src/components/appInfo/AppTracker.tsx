import React from 'react';
import { Briefcase, Award, DollarSign, Clock, Globe } from 'lucide-react';
import { Application } from '../../types';

interface ApplicationTrackerProps {
  applications: Application[];
}

const AppTracker: React.FC<ApplicationTrackerProps> = ({ applications }) => {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">
          No applications tracked yet
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Start analyzing resumes to track your applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">{app.position}</h3>
              <p className="text-gray-600 text-lg">{app.company}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Applied: {app.appliedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Match: {app.score}%
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {app.salary}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {app.location}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span
                className={`px-4 py-2 rounded-full font-semibold text-sm ${
                  app.status === 'Applied'
                    ? 'bg-blue-100 text-blue-700'
                    : app.status === 'Interview'
                    ? 'bg-green-100 text-green-700'
                    : app.status === 'Offer'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {app.status}
              </span>
              <span className="text-xs text-gray-500">Next: {app.nextStep}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppTracker;
