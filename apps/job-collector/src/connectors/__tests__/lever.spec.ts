import { expect, it, vi } from 'vitest';
import { BOARD } from '../../services/__tests__/fixtures';
import { fetchLeverJobs } from '../lever';

const posting = {
  id: 'lever-1',
  text: 'Software Engineer',
  hostedUrl: 'https://jobs.lever.co/example/lever-1',
  applyUrl: 'https://jobs.lever.co/example/lever-1/apply',
  workplaceType: 'remote',
  lists: [{ text: 'Requirements', content: '<li>TypeScript</li>' }],
  salaryRange: {
    currency: 'USD',
    interval: 'per-year',
    min: 120000,
    max: 160000,
  },
};
it('includes requirements lists and maps salary and explicit workplace type', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json([posting]));
  const jobs = await fetchLeverJobs(
    { ...BOARD, provider: 'LEVER', region: 'EU' },
    request,
  );
  expect(request.mock.calls[0][0]).toContain('api.eu.lever.co');
  expect(jobs[0]).toMatchObject({
    workplaceType: 'REMOTE',
    salaryRanges: [{ interval: 'YEAR', minimum: 120000 }],
  });
  expect(jobs[0].description).toContain('TypeScript');
});
it('fetches subsequent pages', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      Response.json(
        Array.from({ length: 100 }, (_, index) => ({
          ...posting,
          id: String(index),
        })),
      ),
    )
    .mockResolvedValueOnce(Response.json([{ ...posting, id: 'last' }]));
  expect(
    await fetchLeverJobs({ ...BOARD, provider: 'LEVER' }, request),
  ).toHaveLength(101);
  expect(request.mock.calls[1][0]).toContain('skip=100');
});
it('retains an advertised salary even without structured ranges', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json([
      {
        ...posting,
        salaryRange: null,
        salaryDescriptionPlain: '$120k–$150k depending on experience',
      },
    ]),
  );
  const jobs = await fetchLeverJobs({ ...BOARD, provider: 'LEVER' }, request);
  expect(jobs[0].salaryText).toContain('$120k');
  expect(jobs[0].salaryRanges).toEqual([]);
});
