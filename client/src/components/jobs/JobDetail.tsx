import React from 'react';
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, Calendar, Tag, ExternalLink, Sparkles } from 'lucide-react';
import { JobListing } from '../../types/index';

interface JobDetailProps {
  job: JobListing;
  onBack: () => void;
  onUseDescription?: (job: JobListing) => void;
}

function formatJobType(jobType: string): string {
  return jobType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const JobDetail: React.FC<JobDetailProps> = ({ job, onBack, onUseDescription }) => {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Job Listings
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex items-start gap-5">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={job.company_name}
              className="w-16 h-16 rounded-xl object-contain bg-gray-50 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-8 h-8 text-indigo-600" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{job.title}</h1>
            <p className="text-lg text-gray-600 font-medium mt-1">{job.company_name}</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mt-6">
          {job.job_type && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium text-sm">
              <Clock className="w-4 h-4" />
              {formatJobType(job.job_type)}
            </span>
          )}
          {job.candidate_required_location && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium text-sm">
              <MapPin className="w-4 h-4" />
              {job.candidate_required_location}
            </span>
          )}
          {job.salary && (
            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium text-sm">
              <DollarSign className="w-4 h-4" />
              {job.salary}
            </span>
          )}
          {job.publication_date && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(job.publication_date)}
            </span>
          )}
          {job.category && (
            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-medium text-sm">
              <Briefcase className="w-4 h-4" />
              {job.category}
            </span>
          )}
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Skills & Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              Apply Now
            </a>
          )}
          {onUseDescription && (
            <button
              onClick={() => onUseDescription(job)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-4 h-4" />
              Optimize My Resume
            </button>
          )}
        </div>
      </div>

      {/* Full Description */}
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Job Description</h2>
        <div
          className="prose prose-gray max-w-none prose-headings:text-gray-800 prose-a:text-indigo-600 prose-li:marker:text-indigo-400"
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      </div>
    </div>
  );
};

export default JobDetail;
