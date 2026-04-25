import React from 'react';
import { Briefcase, MapPin, Clock, Calendar, ChevronRight } from 'lucide-react';
import { JobListing } from '../../types/index';

interface JobCardProps {
  job: JobListing;
  regionLabel?: string;
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

const JobCard: React.FC<JobCardProps> = ({ job, regionLabel, onClick }) => {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company_name}`}
      onClick={() => onClick(job)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(job); } }}
      className="
        flex flex-col bg-white rounded-2xl border border-gray-200
        shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        transition-all duration-200 cursor-pointer group
      "
    >
      <div className="p-4 space-y-3">
        {/* ── Top: Logo + Title + Company ── */}
        <div className="flex items-start gap-3">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt=""
              className="w-10 h-10 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center flex-shrink-0 border border-indigo-100/60">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors duration-200">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{job.company_name}</p>
          </div>
        </div>

        {/* ── Metadata row: job type pill + location + date ── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
          {job.job_type && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
              <Clock className="w-3 h-3" />
              {formatJobType(job.job_type)}
            </span>
          )}
          {job.candidate_required_location && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="truncate">{job.candidate_required_location}</span>
            </span>
          )}
          {job.publication_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              {formatRelativeDate(job.publication_date)}
            </span>
          )}
        </div>

        {/* ── Bottom: source + region badges ── */}
        {(job.source || regionLabel) && (
          <div className="flex flex-wrap gap-1.5">
            {job.source && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {job.source}
              </span>
            )}
            {regionLabel && (
              <span className="text-xs font-medium text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full">
                {regionLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        {job.publication_date ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <Calendar className="w-3 h-3" />
            {formatRelativeDate(job.publication_date)}
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-500 group-hover:text-indigo-700 transition-colors duration-200">
          View Details
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
};

export default JobCard;
