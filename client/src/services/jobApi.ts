import { JobListing } from '../types/index';

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';
const ARBEITNOW_API_URL = 'https://www.arbeitnow.com/api/job-board-api';
const MUSE_API_URL = 'https://www.themuse.com/api/public/jobs';
const JOBICY_API_URL = 'https://jobicy.com/api/v2/remote-jobs';
const REMOTEOK_API_URL = 'https://remoteok.com/api';

// Backend proxy base URL (avoids CORS for sources that don't set Access-Control-Allow-Origin)
const BACKEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const TRUSTED_API_HOSTS = new Set([
  'remotive.com',
  'www.arbeitnow.com',
  'www.themuse.com',
  'jobicy.com',
  'remoteok.com',
  // Backend proxy (localhost or deployed domain) — routes to trusted job boards server-side
  'localhost',
]);

const REMOTIVE_CATEGORIES = new Set([
  'software development',
  'design',
  'marketing',
  'customer service',
  'sales',
  'product',
  'finance / legal',
  'data',
  'devops / sysadmin',
  'qa',
  'writing',
  'human resources',
]);

const MUSE_NON_TECH_CATEGORIES = [
  'Healthcare & Medicine',
  'Education',
  'Legal',
  'Operations',
  'Retail',
  'Science & Biotech',
  'HR & Recruiting',
  'Project & Product Management',
];

async function fetchTrustedJson(url: string): Promise<any> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error('Blocked non-HTTPS API request');
  }

  if (!TRUSTED_API_HOSTS.has(parsed.hostname)) {
    throw new Error(`Blocked untrusted API host: ${parsed.hostname}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed (${response.status}): ${parsed.hostname}`);
  }

  return response.json();
}

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
  const data = await fetchTrustedJson(url);
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
  const data = await fetchTrustedJson(url);
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

async function fetchMuseCategoryJobs(
  museCategory: string,
  sourceLabel: string,
  search?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const jobs = await fetchMuseJobs(search, museCategory, limit);
  return jobs.map((job) => ({
    ...job,
    source: sourceLabel,
  }));
}

function matchesSearch(job: JobListing, searchTerm?: string): boolean {
  if (!searchTerm || !searchTerm.trim()) return true;

  const normalized = searchTerm.trim().toLowerCase();
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const searchableText = [
    job.title,
    job.company_name,
    job.category,
    job.candidate_required_location,
    job.description,
    job.source,
    ...(job.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  // For multi-word search, require every token for higher precision.
  return tokens.every((token) => searchableText.includes(token));
}

async function fetchArbeitnowJobs(
  search?: string,
  _category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const data = await fetchTrustedJson(ARBEITNOW_API_URL);
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
  return fetchJobicyJobsByGeo('usa', 'Jobicy (US)', search, limit);
}

function normalizeJobicyJob(job: any, source: string): JobListing {
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
    company_name: job.companyName || job.jobCompany || '',
    company_logo: job.companyLogo || '',
    category: (job.jobIndustry || [])[0] || '',
    tags: job.jobIndustry || [],
    job_type: (job.jobType || [])[0] || '',
    publication_date: job.pubDate || '',
    candidate_required_location: job.jobGeo || job.jobRegion || 'Remote',
    salary,
    description: job.jobDescription || job.jobExcerpt || '',
    source,
  };
}

async function fetchJobicyJobsByGeo(
  geo: 'usa' | 'canada' | 'europe' | 'asia' | 'africa',
  sourceLabel: string,
  search?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const params = new URLSearchParams();
  params.append('count', String(limit));
  params.append('geo', geo);
  if (search) params.append('tag', search);

  const url = `${JOBICY_API_URL}?${params.toString()}`;
  const data = await fetchTrustedJson(url);
  const jobsArray = data.jobs || [];
  return (jobsArray as any[]).map((job: any) =>
    normalizeJobicyJob(job, sourceLabel)
  );
}

async function fetchRemoteOkJobs(
  search?: string,
  _category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const data = await fetchTrustedJson(REMOTEOK_API_URL);
  const rawJobs = Array.isArray(data) ? data.slice(1) : [];
  let jobs: JobListing[] = (rawJobs as any[]).map((job: any) => ({
    id: Number(job.id) || hashString(job.url || job.slug || String(Math.random())),
    url: job.url || '',
    title: job.position || '',
    company_name: job.company || '',
    company_logo: '',
    category: (job.tags || [])[0] || 'Remote',
    tags: job.tags || [],
    job_type: 'remote',
    publication_date: job.date || '',
    candidate_required_location: job.location || 'Remote',
    salary: job.salary_min && job.salary_max
      ? `USD ${job.salary_min} - ${job.salary_max}`
      : '',
    description: job.description || '',
    source: 'RemoteOK',
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

function matchesCategory(job: JobListing, selectedCategory?: string): boolean {
  if (!selectedCategory || selectedCategory === 'All') return true;

  const text = [
    job.title,
    job.category,
    job.description,
    ...(job.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    'Software Development': ['software', 'developer', 'engineer', 'backend', 'frontend', 'full stack'],
    Design: ['design', 'ux', 'ui', 'graphic'],
    Marketing: ['marketing', 'seo', 'content', 'brand'],
    'Customer Service': ['customer support', 'customer service', 'support specialist'],
    Sales: ['sales', 'account executive', 'business development'],
    Product: ['product manager', 'product owner', 'product'],
    'Finance / Legal': ['finance', 'accounting', 'auditor', 'legal', 'law', 'compliance'],
    Data: ['data', 'analyst', 'scientist', 'machine learning', 'bi'],
    'DevOps / Sysadmin': ['devops', 'sre', 'sysadmin', 'infrastructure', 'cloud engineer'],
    QA: ['qa', 'quality assurance', 'test engineer'],
    Writing: ['writer', 'copywriter', 'editor', 'content writer'],
    'Human Resources': ['human resources', 'hr', 'recruiter', 'talent acquisition'],
    Healthcare: ['healthcare', 'nurse', 'medical', 'clinical', 'physician', 'hospital'],
    Education: ['education', 'teacher', 'instructor', 'tutor', 'curriculum'],
    'Government / Public Service': ['government', 'public service', 'civil service', 'municipal', 'federal'],
    Legal: ['legal', 'lawyer', 'attorney', 'paralegal', 'compliance'],
    Operations: ['operations', 'operations manager', 'process improvement'],
    Manufacturing: ['manufacturing', 'production', 'plant', 'industrial'],
    Logistics: ['logistics', 'supply chain', 'warehouse', 'procurement'],
    'Hospitality / Tourism': ['hospitality', 'hotel', 'tourism', 'travel'],
    Agriculture: ['agriculture', 'farming', 'agronomy', 'agricultural'],
    Construction: ['construction', 'site manager', 'civil engineer', 'building'],
    'Energy / Utilities': ['energy', 'utilities', 'power', 'renewable', 'oil', 'gas'],
  };

  const keywords = categoryKeywords[selectedCategory] || [selectedCategory.toLowerCase()];
  return keywords.some((keyword) => text.includes(keyword));
}

async function fetchWorkingNomadsJobs(
  search?: string,
  _category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const url = `${BACKEND_API_URL}/api/jobs/working-nomads`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`WorkingNomads proxy failed: ${response.status}`);
  const data: any[] = await response.json();

  let jobs: JobListing[] = data.map((job: any) => ({
    id: hashString(job.url || job.title || String(Math.random())),
    url: job.url || '',
    title: job.title || '',
    company_name: job.company_name || '',
    company_logo: '',
    category: job.category_name || '',
    tags: job.tags ? (Array.isArray(job.tags) ? job.tags : [job.tags]) : [],
    job_type: 'remote',
    publication_date: job.pub_date || '',
    candidate_required_location: job.location || 'Remote',
    salary: '',
    description: job.description || '',
    source: 'Working Nomads',
  }));

  return jobs.slice(0, limit);
}

async function fetchHimalayasJobs(
  search?: string,
  _category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const url = `${BACKEND_API_URL}/api/jobs/himalayas`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Himalayas proxy failed: ${response.status}`);
  const data = await response.json();
  const rawJobs: any[] = data.jobs || [];

  let jobs: JobListing[] = rawJobs.map((job: any) => {
    const salaryParts: string[] = [];
    if (job.minSalary) salaryParts.push(`${job.currency || 'USD'} ${job.minSalary}`);
    if (job.maxSalary) salaryParts.push(`${job.maxSalary}`);
    const salary = salaryParts.join(' – ');

    return {
      id: hashString(job.guid || job.applicationLink || job.title || String(Math.random())),
      url: job.applicationLink || '',
      title: job.title || '',
      company_name: job.companyName || '',
      company_logo: job.companyLogo || '',
      category: (job.parentCategories || job.categories || [])[0] || '',
      tags: job.categories || [],
      job_type: job.employmentType || 'remote',
      publication_date: job.pubDate || '',
      candidate_required_location: (job.locationRestrictions || []).join(', ') || 'Remote',
      salary,
      description: job.excerpt || '',
      source: 'Himalayas',
    };
  });

  return jobs.slice(0, limit);
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
  const data = await fetchTrustedJson(url);
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
  const remotiveCategory = category && REMOTIVE_CATEGORIES.has(category.toLowerCase())
    ? category
    : undefined;

  // Fetch from all sources in parallel, handle individual failures gracefully
  const results = await Promise.allSettled([
    fetchRemotiveJobs(search, remotiveCategory, limit),
    fetchMuseJobs(search, undefined, limit),
    ...MUSE_NON_TECH_CATEGORIES.map((museCategory) =>
      fetchMuseCategoryJobs(museCategory, `The Muse (${museCategory})`, search, Math.max(8, Math.floor(limit / 2)))
    ),
    fetchArbeitnowJobs(search, undefined, limit),
    fetchJobicyJobs(search, undefined, limit),
    fetchJobicyJobsByGeo('canada', 'Jobicy (CA)', search, limit),
    fetchJobicyJobsByGeo('europe', 'Jobicy (EU)', search, limit),
    fetchJobicyJobsByGeo('asia', 'Jobicy (Asia)', search, limit),
    fetchJobicyJobsByGeo('africa', 'Jobicy (Africa)', search, limit),
    fetchRemoteOkJobs(search, undefined, limit),
    fetchMuseUSAJobs(search, undefined, limit),
    fetchWorkingNomadsJobs(search, undefined, limit),
    fetchHimalayasJobs(search, undefined, limit),
  ]);

  const allJobs: JobListing[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value);
    }
  }

  // Deduplicate by canonical URL when available, then fallback to title+company.
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter((job) => {
    const urlKey = (job.url || '').trim().toLowerCase();
    const fallbackKey = `${(job.title || '').trim().toLowerCase()}|${(job.company_name || '').trim().toLowerCase()}`;
    const key = urlKey || fallbackKey;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const filteredBySearch = uniqueJobs.filter((job) => matchesSearch(job, search));
  const filteredByCategory = filteredBySearch.filter((job) => matchesCategory(job, category));

  // Sort by date (newest first)
  filteredByCategory.sort((a, b) => {
    const dateA = a.publication_date
      ? new Date(a.publication_date).getTime()
      : 0;
    const dateB = b.publication_date
      ? new Date(b.publication_date).getTime()
      : 0;
    return dateB - dateA;
  });

  return filteredByCategory.slice(0, limit * 4);
}
