import { expect, it, vi } from 'vitest';
import { BOARD } from '../../services/__tests__/fixtures';
import { fetchAshbyJobs } from '../ashby';

const posting = {
  id: 'ashby-1',
  title: 'Software Engineer',
  descriptionPlain: 'TypeScript',
  isListed: true,
  isRemote: true,
  workplaceType: 'Remote',
  jobUrl: 'https://jobs.ashbyhq.com/example/ashby-1',
  compensation: {
    summaryComponents: [
      {
        compensationType: 'Salary',
        currencyCode: 'USD',
        interval: '1 YEAR',
        minValue: 160000,
        maxValue: 190000,
      },
      {
        compensationType: 'EquityPercentage',
        currencyCode: null,
        interval: 'NONE',
        minValue: 1,
        maxValue: 2,
      },
    ],
  },
};
it('normalizes listed jobs and excludes equity from salary', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json({ jobs: [posting, { ...posting, isListed: false }] }),
    );
  const jobs = await fetchAshbyJobs(BOARD, request);
  expect(jobs).toHaveLength(1);
  expect(jobs[0]).toMatchObject({
    workplaceType: 'REMOTE',
    salaryRanges: [
      { currency: 'USD', interval: 'YEAR', minimum: 160000, maximum: 190000 },
    ],
  });
  expect(request.mock.calls[0][0]).toContain('includeCompensation=true');
});
it('does not mistake isRemote=true for fully remote', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json({ jobs: [{ ...posting, workplaceType: 'Hybrid' }] }),
    );
  expect((await fetchAshbyJobs(BOARD, request))[0].workplaceType).toBe(
    'HYBRID',
  );
});
it('keeps valid postings when other jobs have no workplace type', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      jobs: [{ ...posting, workplaceType: null, compensation: null }, posting],
    }),
  );
  const jobs = await fetchAshbyJobs(BOARD, request);
  expect(jobs.map((job) => job.workplaceType)).toEqual(['UNKNOWN', 'REMOTE']);
});
it('rejects a malformed response instead of treating it as an empty board', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ jobs: null }));
  await expect(fetchAshbyJobs(BOARD, request)).rejects.toThrow();
});
