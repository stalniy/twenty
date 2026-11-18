import { expect, it, vi } from 'vitest';

import { BOARD } from '../../services/__tests__/fixtures';
import { salaryFields } from '../../utils/salary-fields.util';
import { fetchElasticJobs } from '../elastic';

const board = {
  ...BOARD,
  provider: 'ELASTIC' as const,
  slug: 'https://jobs.elastic.co/',
};
const feedUrl =
  'https://boards-api.greenhouse.io/v1/boards/elastic/jobs?content=true';
const detailUrl =
  'https://boards-api.greenhouse.io/v1/boards/elastic/jobs/123?pay_transparency=true';
const job = {
  id: 123,
  title: 'Senior Software Engineer',
  absolute_url: 'https://jobs.elastic.co/jobs?gh_jid=123&gh_jid=123',
  location: { name: 'Canada' },
  content:
    '&lt;p&gt;Build with &lt;b&gt;TypeScript&lt;/b&gt; &amp;amp; React.&lt;/p&gt;',
  first_published: '2026-01-01T12:00:00Z',
  metadata: [
    {
      name: 'Target Remote Countries / States Locations [For Job Wrapping]',
      value: ['Canada'],
    },
  ],
};
const feed = (jobs: unknown[] = [job]) => ({
  jobs,
  meta: { total: jobs.length },
});
const requestFor = (responses: Record<string, unknown>) =>
  vi.fn<typeof fetch>(async (url) => {
    const body = responses[String(url)];
    if (body === undefined) throw new Error(`Unexpected URL: ${String(url)}`);
    return Response.json(body);
  });
const defaults = () => ({
  [feedUrl]: feed(),
  [detailUrl]: { id: 123, pay_input_ranges: [] },
});

it('reads the public feed, decodes descriptions, and preserves the exact posting location', async () => {
  const request = requestFor(defaults());
  const [result] = await fetchElasticJobs(board, request);
  expect(result).toMatchObject({
    provider: 'ELASTIC',
    externalId: '123',
    description: 'Build with TypeScript & React.',
    location: 'Canada',
    workplaceType: 'REMOTE',
    sourceUrl: job.absolute_url,
    publishedAt: job.first_published,
  });
  expect(request).toHaveBeenCalledTimes(2);
  for (const [, options] of request.mock.calls)
    expect(options?.headers).toEqual({ Accept: 'application/json' });
});
it.each([
  null,
  [],
  [
    {
      name: 'Target Remote Countries / States Locations [For Job Wrapping]',
      value: [],
    },
  ],
])('does not infer remote status from company policy: %j', async (metadata) => {
  const request = requestFor({ [feedUrl]: feed([{ ...job, metadata }]) });
  expect(await fetchElasticJobs(board, request)).toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
});
it('does not treat a hybrid location as fully remote', async () => {
  const request = requestFor({
    [feedUrl]: feed([{ ...job, location: { name: 'Hybrid - Canada' } }]),
  });
  expect(await fetchElasticJobs(board, request)).toEqual([]);
});
it('converts cents and classifies only explicitly annual USD salary', async () => {
  const request = requestFor({
    ...defaults(),
    [detailUrl]: {
      id: 123,
      pay_input_ranges: [
        {
          min_cents: 15000001,
          max_cents: 20000000,
          currency_type: 'USD',
          title: 'Annual base salary',
          blurb: '',
        },
      ],
    },
  });
  const [result] = await fetchElasticJobs(board, request);
  expect(result.salaryText).toBe('USD 150000.01–200000');
  expect(salaryFields(result)).toEqual({
    salaryMinimumUsd: 150000.01,
    salaryMaximumUsd: 200000,
    salaryPriority: 'OVER_150K',
  });
});
it.each([
  ['USD', 'Salary range', 'Includes annual bonus'],
  ['CAD', 'Annual base salary', ''],
])(
  'keeps uncertain pay periods and non-USD ranges out of USD buckets',
  async (currency, title, blurb) => {
    const request = requestFor({
      ...defaults(),
      [detailUrl]: {
        id: 123,
        pay_input_ranges: [
          {
            min_cents: 15000000,
            max_cents: 20000000,
            currency_type: currency,
            title,
            blurb,
          },
        ],
      },
    });
    const [result] = await fetchElasticJobs(board, request);
    expect(result.salaryText).toContain(currency);
    expect(salaryFields(result).salaryPriority).toBe('OTHER_COMPENSATION');
  },
);
it('accepts a valid empty feed', async () => {
  expect(
    await fetchElasticJobs(board, requestFor({ [feedUrl]: feed([]) })),
  ).toEqual([]);
});
it('reports an incomplete feed instead of silently importing a partial list', async () => {
  await expect(
    fetchElasticJobs(
      board,
      requestFor({ [feedUrl]: { jobs: [job], meta: { total: 2 } } }),
    ),
  ).rejects.toThrow('incomplete');
});
it.each([
  'https://attacker.example/jobs?gh_jid=123',
  'https://jobs.elastic.co/jobs?gh_jid=999',
  'https://jobs.elastic.co/jobs',
])('rejects invalid job links: %s', async (absolute_url) => {
  const request = requestFor({ [feedUrl]: feed([{ ...job, absolute_url }]) });
  await expect(fetchElasticJobs(board, request)).rejects.toThrow('job URL');
  expect(request).toHaveBeenCalledTimes(1);
});
it('rejects pay details for another job', async () => {
  const request = requestFor({
    ...defaults(),
    [detailUrl]: { id: 999, pay_input_ranges: [] },
  });
  await expect(fetchElasticJobs(board, request)).rejects.toThrow(
    'different job',
  );
});
it('reports a missing description rather than silently failing the keyword filter', async () => {
  await expect(
    fetchElasticJobs(
      board,
      requestFor({ [feedUrl]: feed([{ ...job, content: '' }]) }),
    ),
  ).rejects.toThrow('no description');
});
