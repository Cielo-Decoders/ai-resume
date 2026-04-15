import React from 'react';
import { Briefcase, MapPin, Clock, Calendar, ChevronRight } from 'lucide-react';
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

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const summary = stripHtml(job.description).slice(0, 120).trim();
  const visibleTags = job.tags?.slice(0, 3) || [];
  const remainingTags = (job.tags?.length || 0) - 3;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company_name}`}
      onClick={() => onClick(job)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(job); } }}
      className="
        flex flex-col bg-white rounded-2xl border border-gray-200/80
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]
        hover:shadow-[0_8px_30px_rgba(99,102,241,0.12),0_2px_8px_rgba(0,0,0,0.06)]
        hover:border-indigo-200 hover:-translate-y-1
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        transition-all duration-300 ease-out
        cursor-pointer group overflow-hidden
      "
    >
      {/* ── Header ── */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3.5">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt=""
              className="w-11 h-11 rounded-xl object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center flex-shrink-0 border border-indigo-100/60">
              <Briefcase className="w-5 h-5 text-indigo-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{job.company_name}</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 pb-3 flex-1 space-y-3">
        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
          {job.job_type && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-medium">
              <Clock className="w-3 h-3" />
              {formatJobType(job.job_type)}
            </span>
          )}
          {job.candidate_required_location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="truncate max-w-[120px]">{job.candidate_required_location}</span>
            </span>
          )}
          {job.salary && (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              {job.salary}
            </span>
          )}
        </div>

        {/* Description preview */}
        {summary && (
          <p className="text-[13px] leading-relaxed text-gray-500 line-clamp-2">
            {summary}{summary.length >= 120 ? '…' : ''}
          </p>
        )}

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
            {remainingTags > 0 && (
              <span className="text-[11px] font-medium text-gray-400 px-1.5 py-0.5">
                +{remainingTags}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
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
