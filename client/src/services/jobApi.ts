import { JobListing } from '../types/index';

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';

export async function fetchJobListings(
  search?: string,
  category?: string,
  limit: number = 20
): Promise<JobListing[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (limit) params.append('limit', String(limit));

  const url = `${REMOTIVE_API_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch job listings');
  }

  const data = await response.json();
  return data.jobs as JobListing[];
}
