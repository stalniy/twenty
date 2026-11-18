import { describe, expect, it } from 'vitest';
import { createJob } from '../../services/__tests__/fixtures';
import { matchesJob } from '../matches-job.util';

const filters = { targetRole: 'Software Engineer', keywords: ['TypeScript'] };
describe('job matching', () => {
  it('matches senior titles and a case-insensitive keyword', () => {
    expect(
      matchesJob(
        createJob({
          title: 'Staff SOFTWARE  ENGINEER',
          description: 'typescript experience',
        }),
        filters,
      ),
    ).toBe(true);
  });
  it.each([
    { workplaceType: 'HYBRID' as const },
    { workplaceType: 'UNKNOWN' as const },
    { description: 'JavaScript only' },
    { description: 'TypeScriptDeveloper' },
    { title: 'Engineering Manager' },
  ])('rejects nonmatching postings: %j', (overrides) => {
    expect(matchesJob(createJob(overrides), filters)).toBe(false);
  });
  it('requires the target role and accepts any keyword', () => {
    const multipleFilters = {
      targetRole: 'Developer',
      keywords: ['TypeScript', 'React', 'C++'],
    };
    expect(
      matchesJob(
        createJob({
          title: 'Senior Developer',
          description: 'React experience',
        }),
        multipleFilters,
      ),
    ).toBe(true);
    expect(
      matchesJob(
        createJob({
          title: 'Software Developer',
          description: 'C++ experience',
        }),
        multipleFilters,
      ),
    ).toBe(true);
    expect(
      matchesJob(
        createJob({ title: 'Designer', description: 'React experience' }),
        multipleFilters,
      ),
    ).toBe(false);
    expect(
      matchesJob(
        createJob({ title: 'Developer', description: 'Python experience' }),
        multipleFilters,
      ),
    ).toBe(false);
    expect(
      matchesJob(
        createJob({ title: 'Developer', description: 'ReactNative' }),
        multipleFilters,
      ),
    ).toBe(false);
    expect(
      matchesJob(
        createJob({
          title: 'Developer',
          description: 'React',
          workplaceType: 'HYBRID',
        }),
        multipleFilters,
      ),
    ).toBe(false);
  });
  it('treats keyword punctuation literally', () => {
    const keywordFilters = { targetRole: 'Engineer', keywords: ['Node.js'] };
    expect(
      matchesJob(
        createJob({ description: 'Node.js experience' }),
        keywordFilters,
      ),
    ).toBe(true);
    expect(
      matchesJob(
        createJob({ description: 'NodeXjs experience' }),
        keywordFilters,
      ),
    ).toBe(false);
  });
  it('also checks the title for the keyword', () => {
    expect(
      matchesJob(
        createJob({ title: 'Software Engineer (TypeScript)', description: '' }),
        filters,
      ),
    ).toBe(true);
  });
});

it.each([
  'Senior Fullstack Engineer',
  'Senior Fullstack Developer',
  'Full-Stack Developer (Senior)',
  'Developer, Staff Full Stack',
])('collects %s for the Staff full-stack target', (title) => {
  expect(
    matchesJob(createJob({ title }), {
      ...filters,
      targetRole: 'Staff Fullstack Software Engineer',
    }),
  ).toBe(true);
});

it('does not match on seniority alone', () => {
  expect(
    matchesJob(createJob({ title: 'Senior Account Executive' }), {
      ...filters,
      targetRole: 'Staff Fullstack Software Engineer',
    }),
  ).toBe(false);
  expect(
    matchesJob(createJob({ title: 'Senior Engineer' }), {
      ...filters,
      targetRole: 'Senior',
    }),
  ).toBe(false);
});
