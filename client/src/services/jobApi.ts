import { JobListing } from '../types/index';

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';
const ARBEITNOW_API_URL = 'https://www.arbeitnow.com/api/job-board-api';
const MUSE_API_URL = 'https://www.themuse.com/api/public/jobs';
const JOBICY_API_URL = 'https://jobicy.com/api/v2/remote-jobs';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

async function fetchRemotiveJobs(
  search?: string,
  category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) {
    const apiCategory = category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-');
    params.append('category', apiCategory);
  }
  if (limit) params.append('limit', String(limit));

  const url = `${REMOTIVE_API_URL}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch from Remotive');

  const data = await response.json();
  return (data.jobs as any[]).map((job: any) => ({
    ...job,
    source: 'Remotive',
  }));
}

async function fetchMuseJobs(
  search?: string,
  category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const params = new URLSearchParams();
  params.append('page', '1');
  if (category) params.append('category', category);

  const url = `${MUSE_API_URL}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch from The Muse');

  const data = await response.json();
  let jobs: JobListing[] = (data.results as any[]).map((job: any) => ({
    id: job.id,
    url: job.refs?.landing_page || '',
    title: job.name || '',
    company_name: job.company?.name || '',
    company_logo: '',
    category: job.categories?.[0]?.name || '',
    tags: job.levels?.map((l: any) => l.name) || [],
    job_type: job.type || 'external',
    publication_date: job.publication_date || '',
    candidate_required_location:
      job.locations?.map((l: any) => l.name).join(', ') || 'Not specified',
    salary: '',
    description: job.contents || '',
    source: 'The Muse',
  }));

  if (search) {
    const term = search.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(term) ||
        j.company_name.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term)
    );
  }

  return jobs.slice(0, limit);
}

async function fetchArbeitnowJobs(
  search?: string,
  _category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const response = await fetch(ARBEITNOW_API_URL);
  if (!response.ok) throw new Error('Failed to fetch from Arbeitnow');

  const data = await response.json();
  let jobs: JobListing[] = (data.data as any[]).map((job: any) => ({
    id: hashString(job.slug || job.title || String(Math.random())),
    url: job.url || '',
    title: job.title || '',
    company_name: job.company_name || '',
    company_logo: '',
    category: job.tags?.[0] || '',
    tags: job.tags || [],
    job_type: job.job_types?.[0] || '',
    publication_date: job.created_at
      ? new Date(job.created_at * 1000).toISOString()
      : '',
    candidate_required_location:
      job.location || (job.remote ? 'Remote' : 'Not specified'),
    salary: '',
    description: job.description || '',
    source: 'Arbeitnow',
  }));

  if (search) {
    const term = search.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(term) ||
        j.company_name.toLowerCase().includes(term)
    );
  }

  return jobs.slice(0, limit);
}

async function fetchJobicyJobs(
  search?: string,
  _category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const params = new URLSearchParams();
  params.append('count', String(limit));
  params.append('geo', 'usa');
  if (search) params.append('tag', search);

  const url = `${JOBICY_API_URL}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch from Jobicy');

  const data = await response.json();
  const jobsArray = data.jobs || [];
  return (jobsArray as any[]).map((job: any) => {
    const salaryMin = job.annualSalaryMin;
    const salaryMax = job.annualSalaryMax;
    const currency = job.salaryCurrency || 'USD';
    let salary = '';
    if (salaryMin && salaryMax) {
      salary = `${currency} ${salaryMin} - ${salaryMax}`;
    } else if (salaryMin) {
      salary = `${currency} ${salaryMin}+`;
    }

    return {
      id: job.id || hashString(job.url || job.jobTitle || String(Math.random())),
      url: job.url || '',
      title: job.jobTitle || '',
      company_name: job.companyName || '',
      company_logo: job.companyLogo || '',
      category: (job.jobIndustry || [])[0] || '',
      tags: job.jobIndustry || [],
      job_type: (job.jobType || [])[0] || '',
      publication_date: job.pubDate || '',
      candidate_required_location: job.jobGeo || 'USA',
      salary,
      description: job.jobDescription || job.jobExcerpt || '',
      source: 'Jobicy',
    };
  });
}

async function fetchMuseUSAJobs(
  search?: string,
  _category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const usLocations = [
    'New York, NY',
    'San Francisco, CA',
    'Chicago, IL',
    'Los Angeles, CA',
    'Houston, TX',
    'Atlanta, GA',
    'Boston, MA',
    'Dallas, TX',
  ];
  const params = new URLSearchParams();
  params.append('page', '1');
  for (const loc of usLocations) {
    params.append('location', loc);
  }

  const url = `${MUSE_API_URL}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch US jobs from The Muse');

  const data = await response.json();
  let jobs: JobListing[] = (data.results as any[]).map((job: any) => ({
    id: job.id + 1000000,
    url: job.refs?.landing_page || '',
    title: job.name || '',
    company_name: job.company?.name || '',
    company_logo: '',
    category: job.categories?.[0]?.name || '',
    tags: job.levels?.map((l: any) => l.name) || [],
    job_type: job.type || 'external',
    publication_date: job.publication_date || '',
    candidate_required_location:
      job.locations?.map((l: any) => l.name).join(', ') || 'USA',
    salary: '',
    description: job.contents || '',
    source: 'The Muse (US)',
  }));

  if (search) {
    const term = search.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(term) ||
        j.company_name.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term)
    );
  }

  return jobs.slice(0, limit);
}

export async function fetchJobListings(
  search?: string,
  category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  // Fetch from all sources in parallel, handle individual failures gracefully
  const results = await Promise.allSettled([
    fetchRemotiveJobs(search, category, limit),
    fetchMuseJobs(search, undefined, limit),
    fetchArbeitnowJobs(search, undefined, limit),
    fetchJobicyJobs(search, undefined, limit),
    fetchMuseUSAJobs(search, undefined, limit),
  ]);

  const allJobs: JobListing[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value);
    }
  }

  // Deduplicate by source+id
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter((job) => {
    const key = `${job.source}-${job.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date (newest first)
  uniqueJobs.sort((a, b) => {
    const dateA = a.publication_date
      ? new Date(a.publication_date).getTime()
      : 0;
    const dateB = b.publication_date
      ? new Date(b.publication_date).getTime()
      : 0;
    return dateB - dateA;
  });

  return uniqueJobs.slice(0, limit * 3);
}
