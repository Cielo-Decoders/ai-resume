import React from 'react';
import { Briefcase, MapPin, Clock, DollarSign, GraduationCap, ChevronRight } from 'lucide-react';
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
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function deriveWorkMode(location: string | undefined): string | null {
  if (!location) return null;
  const lower = location.toLowerCase();
  if (/remote|anywhere|worldwide/.test(lower)) return 'Remote';
  return 'On-Site';
}

const JobCard: React.FC<JobCardProps> = ({ job, regionLabel, onClick }) => {
  const tags = (job.tags || []).filter(Boolean).slice(0, 3);
  const workMode = deriveWorkMode(job.candidate_required_location);
  const isNew = (() => {
    if (!job.publication_date) return false;
    const ageMs = Date.now() - new Date(job.publication_date).getTime();
    return ageMs < 1000 * 60 * 60 * 24; // less than 24h
  })();

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company_name}`}
      onClick={() => onClick(job)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(job); } }}
      className="
        flex flex-col bg-white rounded-2xl border border-gray-200
        shadow-md hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        transition-all duration-200 cursor-pointer group
      "
    >
      <div className="p-5 space-y-3">
        {/* ── Top: Logo + Company/Title/Location + "New" badge ── */}
        <div className="flex items-start gap-3">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt=""
              className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center flex-shrink-0 border border-indigo-100/60">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-500 truncate">{job.company_name}</p>
              {job.publication_date && (
                <span className={`text-xs font-medium whitespace-nowrap flex-shrink-0 ${isNew ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isNew ? 'New ' : ''}{formatRelativeDate(job.publication_date)}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
              {job.title}
            </h3>
            {job.candidate_required_location && (
              <p className="text-sm text-gray-500 mt-1 truncate">{job.candidate_required_location}</p>
            )}
          </div>
        </div>

        {/* ── Tag pills ── */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Bottom info row: salary, work mode, category, job type ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="truncate">{job.salary || 'Salary not specified'}</span>
          </span>
          {workMode && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              {workMode}
            </span>
          )}
          {job.category && (
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <span className="truncate">{job.category}</span>
            </span>
          )}
          {job.job_type && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              {formatJobType(job.job_type)}
            </span>
          )}
        </div>

        {/* ── Source/region badges (kept, smaller) ── */}
        {(job.source || regionLabel) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {job.source && (
              <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {job.source}
              </span>
            )}
            {regionLabel && (
              <span className="text-[11px] font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                {regionLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end">
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-500 group-hover:text-indigo-700 transition-colors duration-200">
          View Details
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
};

export default JobCard;
