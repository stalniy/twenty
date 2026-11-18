import { expect, it } from 'vitest';
import { BOARD } from '../../services/__tests__/fixtures';
import { parseBoardSlug } from '../parse-board-slug.util';

it('accepts full board URLs and avoids double-encoding slugs', () => {
  expect(
    parseBoardSlug({
      ...BOARD,
      slug: 'https://jobs.ashbyhq.com/Example%20Company',
    }),
  ).toBe('Example%20Company');
  expect(parseBoardSlug({ ...BOARD, slug: 'Example%20Company' })).toBe(
    'Example%20Company',
  );
});
it.each([
  'https://attacker.example/board',
  'https://jobs.ashbyhq.com.evil/board',
  '../board',
  '',
])('rejects invalid board %s', (slug) => {
  expect(() => parseBoardSlug({ ...BOARD, slug })).toThrow();
});

it.each([
  'https://www.workatastartup.com/companies/example',
  'https://www.ycombinator.com/companies/example/jobs',
])('accepts public YC company board URLs: %s', (slug) => {
  expect(
    parseBoardSlug({ ...BOARD, provider: 'WORK_AT_A_STARTUP', slug }),
  ).toBe('example');
});
it.each([
  'https://www.workatastartup.com/companies',
  'https://www.workatastartup.com/jobs/123',
  'https://www.ycombinator.com/companies/example/jobs/individual-job',
])('rejects a non-company YC URL: %s', (slug) => {
  expect(() =>
    parseBoardSlug({ ...BOARD, provider: 'WORK_AT_A_STARTUP', slug }),
  ).toThrow('company URL');
});

it.each([
  ['ELASTIC', 'elastic', 'elastic'],
  ['ELASTIC', 'https://jobs.elastic.co/', 'elastic'],
  ['THE_AA', 'the-aa', 'the-aa'],
  ['THE_AA', 'https://www.theaacareers.co.uk/', 'the-aa'],
  ['THE_AA', 'https://www.theaacareers.co.uk/apply/', 'the-aa'],
  ['FYUL', 'fyul', 'fyul'],
  ['FYUL', 'https://careers.fyul.com/jobs', 'fyul'],
] as const)('accepts fixed company board %s/%s', (provider, slug, expected) => {
  expect(parseBoardSlug({ ...BOARD, provider, slug })).toBe(expected);
});
it.each([
  ['ELASTIC', 'https://jobs.elastic.co.evil/jobs'],
  ['ELASTIC', 'https://jobs.elastic.co/jobs?gh_jid=123'],
  ['FYUL', 'https://careers.fyul.com/jobs/individual-role'],
  ['FYUL', 'https://other.example/jobs'],
  ['THE_AA', 'https://www.theaacareers.co.uk.evil/'],
  ['THE_AA', 'https://www.theaacareers.co.uk/apply/specific-job/'],
  ['THE_AA', 'https://www.theaacareers.co.uk/?search=engineer'],
] as const)('rejects invalid fixed board %s/%s', (provider, slug) => {
  expect(() => parseBoardSlug({ ...BOARD, provider, slug })).toThrow();
});
