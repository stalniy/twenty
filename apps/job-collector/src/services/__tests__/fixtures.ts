import { type JobBoard } from '../../types/job-board';
import { type NormalizedJob } from '../../types/normalized-job';

export const BOARD: JobBoard = {
  id: '811162cb-0a85-4a9e-a8dc-b71c3c8b52a9',
  name: 'Example',
  provider: 'ASHBY',
  slug: 'example',
  region: 'GLOBAL',
  companyId: '95779de4-f966-485e-b8f3-a270dc6d66d7',
};

export const createJob = (
  overrides: Partial<NormalizedJob> = {},
): NormalizedJob => ({
  provider: 'ASHBY',
  externalId: 'job-1',
  title: 'Senior Software Engineer',
  description: 'Build services with TypeScript.',
  sourceUrl: 'https://jobs.ashbyhq.com/example/job-1',
  applyUrl: 'https://jobs.ashbyhq.com/example/job-1/apply',
  location: 'Europe',
  workplaceType: 'REMOTE',
  publishedAt: null,
  salaryText: '',
  salaryRanges: [],
  ...overrides,
});
