import { expect, it, vi } from 'vitest';

import { BOARD } from '../../services/__tests__/fixtures';
import { matchesJob } from '../../utils/matches-job.util';
import { fetchFyulJobs } from '../fyul';

const board = { ...BOARD, provider: 'FYUL' as const, slug: 'fyul' };
const jobUrl = 'https://careers.fyul.com/jobs/123-staff-engineer';
const item = (
  identifier = 123,
  overrides: {
    remoteStatus?: string;
    description?: string;
    guid?: string;
    link?: string;
    locations?: string;
    publicationDate?: string;
  } = {},
) => `<item>
  <title>Staff Engineer &amp; Developer</title>
  <guid>${overrides.guid ?? `source-${identifier}`}</guid>
  <link>${overrides.link ?? `https://careers.fyul.com/jobs/${identifier}-staff-engineer`}</link>
  <description><![CDATA[${overrides.description ?? '<p>Build with <strong>TypeScript</strong> &amp; PostgreSQL.</p>'}]]></description>
  <remoteStatus>${overrides.remoteStatus ?? 'fully'}</remoteStatus>
  <pubDate>${overrides.publicationDate ?? 'Wed, 11 Nov 2026 16:24:56 +0200'}</pubDate>
  ${overrides.locations ?? '<tt:locations><tt:location><tt:name>Poland</tt:name></tt:location><tt:location><tt:name>Spain</tt:name></tt:location></tt:locations>'}
</item>`;
const feed = (items = item()) =>
  `<?xml version="1.0"?><rss version="2.0" xmlns:tt="https://teamtailor.com/locations"><channel><title>FYUL</title>${items}</channel></rss>`;
const response = (xml: string) =>
  new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  });

it('reads the documented public RSS feed with full descriptions and all locations', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => response(feed()));
  const [job] = await fetchFyulJobs(board, request);
  expect(job).toMatchObject({
    provider: 'FYUL',
    externalId: 'source-123',
    title: 'Staff Engineer & Developer',
    sourceUrl: jobUrl,
    applyUrl: jobUrl,
    workplaceType: 'REMOTE',
    location: 'Poland; Spain',
    publishedAt: '2026-11-11T14:24:56.000Z',
  });
  expect(job.description).toBe('Build with TypeScript & PostgreSQL.');
  expect(
    matchesJob(job, { targetRole: 'Engineer', keywords: ['TypeScript'] }),
  ).toBe(true);
  expect(request.mock.calls[0][0]).toBe(
    'https://careers.fyul.com/jobs.rss?offset=0&per_page=100',
  );
  expect(request.mock.calls[0][1]?.headers).toEqual({
    Accept: 'application/rss+xml, application/xml, text/xml',
  });
  expect(request.mock.calls[0][1]?.redirect).toBe('error');
});

it.each([
  ['fully', 'REMOTE'],
  ['hybrid', 'HYBRID'],
  ['onsite', 'ON_SITE'],
  ['', 'UNKNOWN'],
  ['unexpected', 'UNKNOWN'],
])('maps explicit remote status %s to %s', async (remoteStatus, expected) => {
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () =>
      response(feed(item(123, { remoteStatus }))),
    );
  const [job] = await fetchFyulJobs(board, request);
  expect(job.workplaceType).toBe(expected);
});

it('does not infer salary units or remote eligibility from descriptive text', async () => {
  const request = vi.fn<typeof fetch>().mockImplementation(async () =>
    response(
      feed(
        item(123, {
          remoteStatus: '',
          description:
            '<p>Remote company! TypeScript. Salary $150,000 per year.</p>',
        }),
      ),
    ),
  );
  const [job] = await fetchFyulJobs(board, request);
  expect(job.workplaceType).toBe('UNKNOWN');
  expect(job.salaryRanges).toEqual([]);
  expect(job.salaryText).toBe('');
  expect(job.description).toContain('$150,000');
});

it('accepts a valid empty feed', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => response(feed('')));
  expect(await fetchFyulJobs(board, request)).toEqual([]);
});

it('paginates the feed using the documented offset and per_page parameters', async () => {
  const request = vi.fn<typeof fetch>().mockImplementation(async (url) => {
    const offset = Number(new URL(String(url)).searchParams.get('offset'));
    return response(
      feed(
        offset === 0
          ? Array.from({ length: 100 }, (_, index) => item(index + 1)).join('')
          : item(101),
      ),
    );
  });
  const jobs = await fetchFyulJobs(board, request);
  expect(jobs).toHaveLength(101);
  expect(request.mock.calls[1][0]).toContain('offset=100&per_page=100');
  expect(jobs[100].externalId).toBe('source-101');
});

it('rejects a full page repeated by a server that ignores pagination', async () => {
  const xml = feed(
    Array.from({ length: 100 }, (_, index) => item(index + 1)).join(''),
  );
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => response(xml));
  await expect(fetchFyulJobs(board, request)).rejects.toThrow(
    'pagination made no progress',
  );
  expect(request).toHaveBeenCalledTimes(2);
});

it('deduplicates overlapping pages by source GUID', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      response(
        feed(
          Array.from({ length: 100 }, (_, index) => item(index + 1)).join(''),
        ),
      ),
    )
    .mockResolvedValueOnce(response(feed(item(100) + item(101))));
  const jobs = await fetchFyulJobs(board, request);
  expect(jobs).toHaveLength(101);
  expect(new Set(jobs.map((job) => job.externalId)).size).toBe(101);
});

it('preserves separate identities for remote and hybrid versions of an opening', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () =>
      response(feed(item(123) + item(124, { remoteStatus: 'hybrid' }))),
    );
  const jobs = await fetchFyulJobs(board, request);
  expect(jobs.map((job) => job.externalId)).toEqual([
    'source-123',
    'source-124',
  ]);
  expect(new Set(jobs.map((job) => job.sourceUrl)).size).toBe(2);
});

it('keeps unavailable location and date metadata empty', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () =>
      response(
        feed(item(123, { locations: '', publicationDate: 'not a date' })),
      ),
    );
  const [job] = await fetchFyulJobs(board, request);
  expect(job.location).toBe('');
  expect(job.publishedAt).toBeNull();
});

it('uses city and country when a named location is unavailable', async () => {
  const request = vi.fn<typeof fetch>().mockImplementation(async () =>
    response(
      feed(
        item(123, {
          locations:
            '<tt:locations><tt:location><tt:city>Warsaw</tt:city><tt:country>Poland</tt:country></tt:location></tt:locations>',
        }),
      ),
    ),
  );
  expect((await fetchFyulJobs(board, request))[0].location).toBe(
    'Warsaw, Poland',
  );
});

it.each([
  '<html>Sign in</html>',
  '<rss><channel><item><title>Missing fields</title></item></channel></rss>',
])('rejects incomplete or malformed XML feeds', async (xml) => {
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => response(xml));
  await expect(fetchFyulJobs(board, request)).rejects.toThrow();
});

it('does not interpret an HTML login or challenge page as an empty feed', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    new Response('<html>Sign in</html>', {
      headers: { 'content-type': 'text/html' },
    }),
  );
  await expect(fetchFyulJobs(board, request)).rejects.toThrow('XML job feed');
});

it('reports access failures without retrying or supplying credentials', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('', { status: 403 }));
  await expect(fetchFyulJobs(board, request)).rejects.toThrow('HTTP 403');
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][1]?.headers).toEqual({
    Accept: 'application/rss+xml, application/xml, text/xml',
  });
});

it('rejects another company host before any request', async () => {
  const request = vi.fn<typeof fetch>();
  await expect(
    fetchFyulJobs({ ...board, slug: 'https://attacker.example/jobs' }, request),
  ).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});

it.each([
  'https://attacker.example/jobs/123',
  'https://careers.fyul.com/connect',
  'https://careers.fyul.com/jobs/123#other',
  'https://careers.fyul.com/jobs/123?tracking=1',
])('rejects invalid source links: %s', async (link) => {
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => response(feed(item(123, { link }))));
  await expect(fetchFyulJobs(board, request)).rejects.toThrow(
    'invalid public posting URL',
  );
});
