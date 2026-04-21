import React from 'react';
import { Briefcase, MapPin, Clock, DollarSign, Calendar } from 'lucide-react';
import { JobListing } from '../../types/index';

interface JobCardProps {
  job: JobListing;
  onClick: (job: JobListing) => void;
  onUseDescription: (job: JobListing) => void;
}

function formatJobType(jobType: string): string {
  return jobType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  return (
    <div
      className="w-full text-left bg-white rounded-xl shadow-md hover:shadow-[0_8px_30px_rgba(79,70,229,0.15)] transition-all duration-300 ease-out p-5 border border-gray-200 hover:border-indigo-300 hover:-translate-y-1 group cursor-pointer"
      onClick={() => onClick(job)}
    >
      <div className="flex items-start gap-4">
        {job.company_logo ? (
          <img
            src={job.company_logo}
            alt={job.company_name}
            className="w-12 h-12 rounded-lg object-contain bg-gray-50 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-indigo-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
            {job.title}
          </h3>
          <p className="text-gray-600 font-medium mt-0.5">{job.company_name}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
            {job.job_type && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                <Clock className="w-3.5 h-3.5" />
                {formatJobType(job.job_type)}
              </span>
            )}
            {job.candidate_required_location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.candidate_required_location}
              </span>
            )}
            {job.salary && (
              <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="w-3.5 h-3.5" />
                {job.salary}
              </span>
            )}
            {job.publication_date && (
              <span className="inline-flex items-center gap-1 text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {formatRelativeDate(job.publication_date)}
              </span>
            )}
          </div>
          {job.source && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 ml-auto flex-shrink-0">
              {job.source}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
