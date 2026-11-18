import { describe, expect, it } from 'vitest';

import {
  prepareSelectedProfileMatches,
  selectedMatchingInputSchema,
} from '../prepare-selected-profile-matches.service';
import { type MatchingPosting } from '../profile-matching.service';

const POSITION_ID = 'af7b810d-3eea-462e-88e6-bb31321ec230';
const OTHER_POSITION_ID = 'b648f321-9ed8-4490-ae5f-851846d333cc';
const POSTING: MatchingPosting = {
  id: '007c97bb-de36-42f9-b33c-520902164080',
  name: 'Senior TypeScript Engineer',
  description: 'Build authorization tools using Node.js.',
  location: 'Remote',
  workplaceType: 'REMOTE',
  salaryText: '$150,000 annually',
  jobPositionId: POSITION_ID,
};

describe('selected profile matching', () => {
  it('rejects missing, empty, mixed and malformed selections', () => {
    for (const input of [
      {},
      { positions: [] },
      { positionId: 'bad' },
      { positions: [{ id: 'bad' }] },
      { positionId: POSITION_ID, positions: [{ id: OTHER_POSITION_ID }] },
    ]) {
      expect(selectedMatchingInputSchema.safeParse(input).success).toBe(false);
    }
    expect(
      selectedMatchingInputSchema.safeParse({ positionId: POSITION_ID })
        .success,
    ).toBe(true);
    expect(
      selectedMatchingInputSchema.safeParse({
        positions: [{ id: POSITION_ID }],
      }).success,
    ).toBe(true);
  });

  it('never adds postings outside the selection and reports missing descriptions', () => {
    const result = prepareSelectedProfileMatches(
      [
        POSTING,
        {
          ...POSTING,
          id: '00824770-93df-47ee-8c9b-8d08dd6a79b1',
          jobPositionId: OTHER_POSITION_ID,
        },
      ],
      [POSITION_ID],
      'CV',
      25,
      false,
    );
    expect(result.selectedPositions).toBe(1);
    expect(result.candidates.map((candidate) => candidate.postingId)).toEqual([
      POSTING.id,
    ]);
    expect(result.positionsWithoutDescriptions).toEqual([]);
    const missing = prepareSelectedProfileMatches(
      [{ ...POSTING, description: '' }],
      [POSITION_ID],
      'CV',
      25,
      false,
    );
    expect(missing.positionsWithoutDescriptions).toEqual([POSITION_ID]);
    expect(missing.candidates).toEqual([]);
    expect(
      prepareSelectedProfileMatches([POSTING], [], 'CV', 25, false).candidates,
    ).toEqual([]);
  });

  it('reuses bulk assessments and allows an explicit single-record reassessment', () => {
    const first = prepareSelectedProfileMatches(
      [POSTING],
      [POSITION_ID],
      'CV',
      25,
      false,
    );
    const assessed = {
      ...POSTING,
      matchFingerprint: first.candidates[0].fingerprint,
    };
    expect(
      prepareSelectedProfileMatches([assessed], [POSITION_ID], 'CV', 25, false)
        .pending,
    ).toBe(0);
    expect(
      prepareSelectedProfileMatches([assessed], [POSITION_ID], 'CV', 25, true)
        .pending,
    ).toBe(1);
  });
});
