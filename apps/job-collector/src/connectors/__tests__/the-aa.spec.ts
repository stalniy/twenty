import { expect, it, vi } from 'vitest';

import { BOARD } from '../../services/__tests__/fixtures';
import { matchesJob } from '../../utils/matches-job.util';
import { fetchTheAaJobs } from '../the-aa';

const board = { ...BOARD, provider: 'THE_AA' as const, slug: 'the-aa' };
const posting = (id = '744000160649508') => ({
  id,
  name: 'Software Developer',
  company: { identifier: 'TheAA1' },
  visibility: 'PUBLIC',
  customField: [{ fieldLabel: 'Location', valueLabel: 'HOME WORKER' }],
  releasedDate: '2026-11-09T12:00:00.000Z',
  location: {
    fullLocation: 'Remote, United Kingdom',
    remote: true,
    hybrid: false,
  },
});
const detail = () => ({
  ...posting(),
  active: true,
  postingUrl: `https://jobs.smartrecruiters.com/TheAA1/${posting().id}-software-developer`,
  applyUrl: `https://jobs.smartrecruiters.com/TheAA1/${posting().id}-software-developer?oga=true`,
  jobAd: {
    sections: {
      companyDescription: {
        title: 'Company Description',
        text: '<p>Build with TypeScript &amp; React.</p>',
      },
      jobDescription: {
        title: 'Job Description',
        text: '<p>Salary £80,000 per year.</p><script>bad()</script>',
      },
      qualifications: {
        title: 'Qualifications',
        text: '<p>Engineering experience.</p>',
      },
    },
  },
});
const feed = (
  content: unknown[] = [posting()],
  totalFound = content.length,
  offset = 0,
) => ({
  offset,
  limit: 100,
  totalFound,
  content,
});
const requestFor = (job: unknown = detail()) =>
  vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json(feed()))
    .mockResolvedValueOnce(Response.json(job));

it('collects full descriptions, public application links, dates, locations and original salary', async () => {
  const request = requestFor();
  const [job] = await fetchTheAaJobs(board, request);
  expect(job).toMatchObject({
    provider: 'THE_AA',
    externalId: posting().id,
    title: 'Software Developer',
    sourceUrl: detail().postingUrl,
    applyUrl: detail().applyUrl,
    location: 'Remote, United Kingdom',
    workplaceType: 'REMOTE',
    publishedAt: posting().releasedDate,
    salaryText: 'Salary £80,000 per year.',
    salaryRanges: [],
  });
  expect(job.description).toContain('Build with TypeScript & React.');
  expect(job.description).toContain('Engineering experience.');
  expect(job.description).not.toContain('bad()');
  expect(
    matchesJob(job, {
      targetRole: 'Software Developer',
      keywords: ['TypeScript'],
    }),
  ).toBe(true);
  expect(request.mock.calls.map(([url]) => url)).toEqual([
    'https://api.smartrecruiters.com/v1/companies/TheAA1/postings?limit=100&offset=0',
    `https://api.smartrecruiters.com/v1/companies/TheAA1/postings/${posting().id}`,
  ]);
});

it.each([
  { location: { remote: true, hybrid: true } },
  { location: { remote: false, hybrid: false } },
  { location: {} },
  { customField: [] },
  { customField: [{ fieldLabel: 'Location', valueLabel: 'FIELD WORKER' }] },
])(
  'excludes hybrid, on-site, unknown and field-worker roles: %j',
  async (override) => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(feed([{ ...posting(), ...override }])));
    expect(await fetchTheAaJobs(board, request)).toEqual([]);
    expect(request).toHaveBeenCalledTimes(1);
  },
);

it('rechecks workplace status in job details', async () => {
  expect(
    await fetchTheAaJobs(
      board,
      requestFor({ ...detail(), location: { remote: true, hybrid: true } }),
    ),
  ).toEqual([]);
});

it('accepts an empty public feed', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json(feed([])));
  expect(await fetchTheAaJobs(board, request)).toEqual([]);
});

it('reads all pages even when the first page contains no remote jobs', async () => {
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    ...posting(String(index + 1)),
    location: { remote: false },
  }));
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json(feed(firstPage, 101)))
    .mockResolvedValueOnce(Response.json(feed([posting()], 101, 100)))
    .mockResolvedValueOnce(Response.json(detail()));
  expect(await fetchTheAaJobs(board, request)).toHaveLength(1);
  expect(request.mock.calls[1][0]).toContain('offset=100');
});

it.each([
  feed([], 1),
  feed([posting(), posting()]),
  { ...feed(), offset: 100 },
  { content: [] },
])('rejects incomplete or repeated feeds', async (value) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(value));
  await expect(fetchTheAaJobs(board, request)).rejects.toThrow();
});

it.each([
  { id: '1' },
  { active: false },
  { company: { identifier: 'OtherCompany' } },
  { postingUrl: 'https://attacker.example/job' },
  { applyUrl: 'https://jobs.smartrecruiters.com/TheAA1/1-other-job' },
  { jobAd: { sections: {} } },
])('rejects invalid or missing required details: %j', async (override) => {
  await expect(
    fetchTheAaJobs(board, requestFor({ ...detail(), ...override })),
  ).rejects.toThrow();
});

it('leaves missing optional location and publication metadata unset', async () => {
  const [job] = await fetchTheAaJobs(
    board,
    requestFor({
      ...detail(),
      location: { remote: true },
      releasedDate: undefined,
    }),
  );
  expect(job.location).toBe('');
  expect(job.publishedAt).toBeNull();
});

it('rejects unrelated boards before any request', async () => {
  const request = vi.fn<typeof fetch>();
  await expect(
    fetchTheAaJobs({ ...board, slug: 'https://example.com/' }, request),
  ).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});

it('reports access failures', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('', { status: 403 }));
  await expect(fetchTheAaJobs(board, request)).rejects.toThrow('HTTP 403');
});

it('preserves explicit salary metadata without assuming a currency or period', async () => {
  const jobDetail = detail();
  jobDetail.customField.push({
    fieldLabel: 'Salary',
    valueLabel: 'Competitive',
  });
  const [job] = await fetchTheAaJobs(board, requestFor(jobDetail));
  expect(job.salaryText).toContain('Competitive');
  expect(job.salaryRanges).toEqual([]);
});
