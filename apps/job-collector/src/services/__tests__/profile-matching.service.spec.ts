import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  matchingBatchSize,
  prepareProfileMatches,
  type MatchingPosting,
} from '../profile-matching.service';

const POSTING: MatchingPosting = {
  id: 'b648f321-9ed8-4490-ae5f-851846d333cc',
  name: 'Senior TypeScript Engineer',
  description:
    'Build authorization and developer tooling with Node.js and React.',
  location: 'Poland',
  workplaceType: 'REMOTE',
  salaryText: '',
  matchFingerprint: null,
};

afterEach(() => vi.unstubAllEnvs());

describe('profile matching queue', () => {
  it('reuses an unchanged assessment and rescans when the profile or posting changes', () => {
    const first = prepareProfileMatches([POSTING], 'TypeScript engineer', 25);
    const assessed = {
      ...POSTING,
      matchFingerprint: first.candidates[0].fingerprint,
    };
    expect(
      prepareProfileMatches([assessed], 'TypeScript engineer', 25).candidates,
    ).toEqual([]);
    expect(
      prepareProfileMatches([assessed], 'Platform engineer', 25).pending,
    ).toBe(1);
    expect(
      prepareProfileMatches(
        [{ ...assessed, location: 'US only' }],
        'TypeScript engineer',
        25,
      ).pending,
    ).toBe(1);
    expect(
      prepareProfileMatches(
        [{ ...assessed, description: 'Different requirements' }],
        'TypeScript engineer',
        25,
      ).pending,
    ).toBe(1);
  });

  it('batches pending postings and leaves missing descriptions unassessed', () => {
    const result = prepareProfileMatches(
      [
        POSTING,
        { ...POSTING, id: 'af7b810d-3eea-462e-88e6-bb31321ec230' },
        { ...POSTING, description: '  ' },
      ],
      'CV',
      1,
    );
    expect(result).toMatchObject({ pending: 2, remaining: 1 });
    expect(result.candidates).toHaveLength(1);
    expect(JSON.parse(result.candidates[0].prompt)).toEqual({
      resume: { text: 'CV', records: [] },
      posting: {
        title: POSTING.name,
        description: POSTING.description,
        location: POSTING.location,
        workplaceType: 'REMOTE',
        salary: '',
      },
    });
  });

  it('reassesses a CV when a Skill link changes even if the rendered text is unchanged', () => {
    const record = {
      id: POSTING.id,
      kind: 'achievement' as const,
      name: 'Shipping React',
      text: 'Shipped a React feature',
      skillIds: [],
    };
    const { candidates } = prepareProfileMatches([POSTING], 'CV', 1, [record]);
    const posting = { ...POSTING, matchFingerprint: candidates[0].fingerprint };
    expect(prepareProfileMatches([posting], 'CV', 1, [record]).pending).toBe(0);
    expect(
      prepareProfileMatches([posting], 'CV', 1, [
        {
          ...record,
          skillIds: ['af7b810d-3eea-462e-88e6-bb31321ec230'],
        },
      ]).pending,
    ).toBe(1);
  });

  it('uses the configured batch size and rejects an unbounded batch', () => {
    vi.stubEnv('MATCH_BATCH_SIZE', '5');
    expect(matchingBatchSize()).toBe(5);
    vi.stubEnv('MATCH_BATCH_SIZE', '0');
    expect(() => matchingBatchSize()).toThrow();
  });
});
