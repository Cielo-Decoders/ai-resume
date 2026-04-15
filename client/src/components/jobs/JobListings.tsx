import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { JobListing } from '../../types/index';
import { fetchJobListings } from '../../services/jobApi';
import JobCard from './JobCard';
import JobDetail from './JobDetail';

const CATEGORIES = [
  'All',
  'Software Development',
  'Design',
  'Marketing',
  'Customer Service',
  'Sales',
  'Product',
  'Finance / Legal',
  'Data',
  'DevOps / Sysadmin',
  'QA',
  'Writing',
  'Human Resources',
  'Healthcare',
  'Education',
  'Government / Public Service',
  'Legal',
  'Operations',
  'Manufacturing',
  'Logistics',
  'Hospitality / Tourism',
  'Agriculture',
  'Construction',
  'Energy / Utilities',
];

const REGIONS = ['All Regions', 'USA', 'Canada', 'Europe', 'Asia', 'Africa', 'Remote'] as const;
type RegionFilter = typeof REGIONS[number];

function detectRegion(job: JobListing): RegionFilter {
  const text = `${job.candidate_required_location || ''} ${job.source || ''}`.toLowerCase();

  if (
    /(united states|usa|\bus\b|new york|california|texas|chicago|boston|seattle|miami|atlanta|los angeles|san francisco)/.test(text)
  ) {
    return 'USA';
  }

  if (/(canada|toronto|vancouver|montreal|ottawa|calgary|edmonton)/.test(text)) {
    return 'Canada';
  }

  if (
    /(europe|\beu\b|united kingdom|uk|germany|france|spain|italy|netherlands|sweden|denmark|norway|finland|ireland|portugal|poland|switzerland|austria|belgium|czech)/.test(text)
  ) {
    return 'Europe';
  }

  if (
    /(asia|india|singapore|japan|china|south korea|korea|malaysia|thailand|indonesia|philippines|vietnam|pakistan|bangladesh|uae|dubai|qatar|saudi)/.test(text)
  ) {
    return 'Asia';
  }

  if (
    /(africa|nigeria|kenya|south africa|ghana|uganda|rwanda|tanzania|egypt|morocco|tunisia|ethiopia)/.test(text)
  ) {
    return 'Africa';
  }

  if (/(remote|anywhere|worldwide|global)/.test(text)) {
    return 'Remote';
  }

  return 'Remote';
}

interface JobListingsProps {
  onUseDescription?: (job: JobListing) => void;
}

const JobListings: React.FC<JobListingsProps> = ({ onUseDescription }) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeRegion, setActiveRegion] = useState<RegionFilter>('All Regions');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const category = activeCategory === 'All' ? undefined : activeCategory;
      const results = await fetchJobListings(searchTerm || undefined, category, 30);
      const sorted = [...results].sort((a, b) => {
        const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
        const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
        return dateB - dateA;
      });
      setJobs(sorted);
    } catch {
      setError('Failed to load job listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeCategory]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const filteredJobs = useMemo(() => {
    if (activeRegion === 'All Regions') return jobs;
    return jobs.filter((job) => detectRegion(job) === activeRegion);
  }, [jobs, activeRegion]);

  if (selectedJob) {
    return <JobDetail job={selectedJob} onBack={() => setSelectedJob(null)} onUseDescription={onUseDescription} />;
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs by title, company, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2 pt-1 max-w-6xl mx-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category Filters</h3>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 max-w-6xl mx-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1 max-w-6xl mx-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Region Filters</h3>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Region Filters */}
      <div className="flex flex-wrap gap-2 max-w-6xl mx-auto">
        {REGIONS.map((region) => (
          <button
            key={region}
            onClick={() => setActiveRegion(region)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeRegion === region
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {region}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-gray-500 mt-4 font-medium">Loading job listings...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={loadJobs}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Try Again
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500 font-medium">No jobs found. Try adjusting your search, category, or region.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 font-medium">{filteredJobs.length} positions found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {filteredJobs.map((job) => (
              <JobCard
                key={`${job.source}-${job.id}`}
                job={job}
                regionLabel={detectRegion(job)}
                onClick={setSelectedJob}
                onUseDescription={onUseDescription || (() => {})}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default JobListings;
