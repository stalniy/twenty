import { expect, it, vi } from 'vitest';

import { BOARD } from '../../services/__tests__/fixtures';
import { matchesJob } from '../../utils/matches-job.util';
import { salaryFields } from '../../utils/salary-fields.util';
import { fetchWorkAtStartupJobs } from '../work-at-startup';

const board = { ...BOARD, provider: 'WORK_AT_A_STARTUP' as const };
const job = {
  id: 1,
  title: 'Software Engineer',
  location: 'Remote (Europe)',
  salaryRange: '$120K - $180K',
};
const companyUrl = 'https://www.workatastartup.com/companies/example';
const directoryUrl = 'https://www.ycombinator.com/companies/example/jobs';
const jobUrl = `${directoryUrl}/job-1`;
const page = (component: string, props: unknown, metadata?: unknown) => {
  const serialized = JSON.stringify({ component, props })
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;');
  return `<div data-page="${serialized}"></div>${metadata ? `<script type="application/ld+json">${JSON.stringify(metadata)}</script>` : ''}`;
};
const companyPage = (jobs: unknown[] = [job]) =>
  page('jobs/public/pages/CompanyV2Page', {
    company: { slug: 'example', jobs },
  });
const directoryPage = (
  jobs = [{ id: 1, url: '/companies/example/jobs/job-1' }],
) =>
  page('WaasShowJobsPage', { company: { slug: 'example' }, jobPostings: jobs });
const descriptionPage = (
  overrides: Record<string, unknown> = {},
  metadata?: unknown,
) =>
  page(
    'WaasShowJobPage',
    {
      company: { slug: 'example' },
      job: {
        ...job,
        description:
          '<p>Build services with <b>TypeScript</b> &amp; PostgreSQL.</p>',
        applyUrl: 'https://account.ycombinator.com/authenticate',
        ...overrides,
      },
    },
    metadata,
  );
const requestFor = (pages: Record<string, string | number>) =>
  vi.fn<typeof fetch>(async (url) => {
    const value = pages[String(url)];
    if (value === undefined) throw new Error(`Unexpected URL: ${String(url)}`);
    return typeof value === 'number'
      ? new Response('', { status: value })
      : new Response(value, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
  });
const defaultPages = () => ({
  [companyUrl]: companyPage(),
  [directoryUrl]: directoryPage(),
  [jobUrl]: descriptionPage(),
});

it('reads public JSON and descriptions without credentials and preserves a public job URL', async () => {
  const request = requestFor(defaultPages());
  const jobs = await fetchWorkAtStartupJobs(board, request);
  expect(jobs).toHaveLength(1);
  expect(jobs[0]).toMatchObject({
    provider: 'WORK_AT_A_STARTUP',
    externalId: '1',
    workplaceType: 'REMOTE',
    location: 'Remote (Europe)',
    sourceUrl: jobUrl,
    applyUrl: jobUrl,
  });
  expect(jobs[0].description).toContain('TypeScript & PostgreSQL.');
  expect(
    matchesJob(jobs[0], {
      targetRole: 'Software Engineer',
      keywords: ['TypeScript'],
    }),
  ).toBe(true);
  for (const [, options] of request.mock.calls) {
    expect(options?.headers).toEqual({ Accept: 'text/html' });
    expect(options?.redirect).toBe('error');
  }
});

it('retains salary text but only normalizes explicit annual USD metadata', async () => {
  const request = requestFor({
    ...defaultPages(),
    [jobUrl]: descriptionPage(
      {},
      {
        '@type': 'JobPosting',
        baseSalary: {
          currency: 'USD',
          value: { unitText: 'YEAR', minValue: 120000, maxValue: 180000 },
        },
      },
    ),
  });
  const [result] = await fetchWorkAtStartupJobs(board, request);
  expect(salaryFields(result)).toEqual({
    salaryMinimumUsd: 120000,
    salaryMaximumUsd: 180000,
    salaryPriority: 'OVER_100K',
  });
  expect(result.salaryText).toBe('$120K - $180K');
  const [withoutMetadata] = await fetchWorkAtStartupJobs(
    board,
    requestFor(defaultPages()),
  );
  expect(withoutMetadata.salaryRanges).toEqual([]);
  expect(salaryFields(withoutMetadata).salaryPriority).toBe(
    'OTHER_COMPENSATION',
  );
});

it('returns an empty board without fetching more pages', async () => {
  const request = requestFor({ [companyUrl]: companyPage([]) });
  expect(await fetchWorkAtStartupJobs(board, request)).toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
});

it.each(['Hybrid (Europe)', 'Partly remote', 'London', null])(
  'excludes jobs without an explicit remote location: %s',
  async (location) => {
    const request = requestFor({
      [companyUrl]: companyPage([{ ...job, location }]),
    });
    expect(await fetchWorkAtStartupJobs(board, request)).toEqual([]);
    expect(request).toHaveBeenCalledTimes(1);
  },
);

it('keeps distinct jobs separate when both application links lead to sign-in', async () => {
  const secondUrl = `${directoryUrl}/job-2`;
  const request = requestFor({
    ...defaultPages(),
    [companyUrl]: companyPage([job, { ...job, id: 2 }]),
    [directoryUrl]: directoryPage([
      { id: 1, url: '/companies/example/jobs/job-1' },
      { id: 2, url: '/companies/example/jobs/job-2' },
    ]),
    [secondUrl]: descriptionPage({ id: 2 }),
  });
  const jobs = await fetchWorkAtStartupJobs(board, request);
  expect(jobs.map((posting) => posting.applyUrl)).toEqual([jobUrl, secondUrl]);
  expect(jobs.map((posting) => posting.externalId)).toEqual(['1', '2']);
});

it('preserves an employer application URL for cross-source deduplication', async () => {
  const applyUrl = 'https://jobs.ashbyhq.com/example/external-job/apply';
  const request = requestFor({
    ...defaultPages(),
    [jobUrl]: descriptionPage({ applyUrl }),
  });
  expect((await fetchWorkAtStartupJobs(board, request))[0].applyUrl).toBe(
    applyUrl,
  );
});

it('reports a blocked description instead of importing an incomplete posting', async () => {
  const request = requestFor({ ...defaultPages(), [jobUrl]: 403 });
  await expect(fetchWorkAtStartupJobs(board, request)).rejects.toThrow(
    'HTTP 403',
  );
  expect(
    request.mock.calls.filter(([url]) => String(url) === jobUrl),
  ).toHaveLength(1);
});

it('reports missing public description links', async () => {
  const request = requestFor({
    ...defaultPages(),
    [directoryUrl]: directoryPage([]),
  });
  await expect(fetchWorkAtStartupJobs(board, request)).rejects.toThrow(
    'description URL is unavailable',
  );
});

it.each([
  '<html>Sign in</html>',
  page('jobs/public/pages/HomeV2Page', { jobs: [] }),
  page('jobs/public/pages/CompanyV2Page', { company: { slug: 'example' } }),
])('rejects unavailable or changed company pages', async (html) => {
  await expect(
    fetchWorkAtStartupJobs(board, requestFor({ [companyUrl]: html })),
  ).rejects.toThrow();
});

it('rejects a foreign description URL before fetching it', async () => {
  const request = requestFor({
    ...defaultPages(),
    [directoryUrl]: directoryPage([
      { id: 1, url: 'https://attacker.example/jobs/1' },
    ]),
  });
  await expect(fetchWorkAtStartupJobs(board, request)).rejects.toThrow(
    'Invalid public YC description URL',
  );
  expect(request).toHaveBeenCalledTimes(2);
});

it('rejects a description for a different job', async () => {
  const request = requestFor({
    ...defaultPages(),
    [jobUrl]: descriptionPage({ id: 2 }),
  });
  await expect(fetchWorkAtStartupJobs(board, request)).rejects.toThrow(
    'different job',
  );
});

it('rejects a description with no body rather than silently failing the keyword filter', async () => {
  const request = requestFor({
    ...defaultPages(),
    [jobUrl]: descriptionPage({ description: '' }),
  });
  await expect(fetchWorkAtStartupJobs(board, request)).rejects.toThrow();
});

it('waits for in-flight requests and stops starting new descriptions after a failure', async () => {
  let resolveSecond!: (response: Response) => void;
  const secondResponse = new Promise<Response>((resolve) => {
    resolveSecond = resolve;
  });
  const secondUrl = `${directoryUrl}/job-2`;
  const pages = requestFor({
    ...defaultPages(),
    [companyUrl]: companyPage([job, { ...job, id: 2 }, { ...job, id: 3 }]),
    [directoryUrl]: directoryPage(
      [1, 2, 3].map((id) => ({ id, url: `/companies/example/jobs/job-${id}` })),
    ),
    [jobUrl]: 403,
  });
  const request = vi.fn<typeof fetch>((url, options) =>
    String(url) === secondUrl ? secondResponse : pages(url, options),
  );
  let settled = false;
  const pending = fetchWorkAtStartupJobs(board, request).catch(
    (error: unknown) => {
      settled = true;
      return error;
    },
  );
  await vi.waitFor(() =>
    expect(request.mock.calls.some(([url]) => String(url) === secondUrl)).toBe(
      true,
    ),
  );
  expect(settled).toBe(false);
  resolveSecond(
    new Response(descriptionPage({ id: 2 }), {
      headers: { 'content-type': 'text/html' },
    }),
  );
  expect(await pending).toBeInstanceOf(Error);
  expect(
    request.mock.calls.some(([url]) => String(url).endsWith('/job-3')),
  ).toBe(false);
});
