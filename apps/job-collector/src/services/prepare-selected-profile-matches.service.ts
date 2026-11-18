import { z } from 'zod';
import { cvRecordSchema } from './jd-match-assessment.service';

import {
  type MatchingPosting,
  prepareProfileMatches,
} from './profile-matching.service';

export const selectedMatchingInputSchema = z
  .object({
    personId: z.preprocess(
      (value) => (value === '' || value == null ? undefined : value),
      z.uuid().optional(),
    ),
    positionId: z.uuid().optional(),
    positions: z
      .array(z.object({ id: z.uuid() }))
      .min(1)
      .max(5000)
      .optional(),
    force: z.boolean().default(false),
  })
  .refine(
    (input) =>
      (input.positionId !== undefined) !== (input.positions !== undefined),
    {
      message:
        'Provide exactly one Job Position or a nonempty selection of Job Positions.',
    },
  );

export const prepareSelectedProfileMatches = (
  postings: MatchingPosting[],
  positionIds: string[],
  profile: string,
  batchSize: number,
  force: boolean,
  records: z.infer<typeof cvRecordSchema>[] = [],
) => {
  const selected = new Set(positionIds);
  const matching = postings.filter(
    (posting) => posting.jobPositionId && selected.has(posting.jobPositionId),
  );
  const positionsWithDescriptions = new Set(
    matching
      .filter((posting) => posting.description?.trim())
      .map((posting) => posting.jobPositionId),
  );
  return {
    ...prepareProfileMatches(
      force
        ? matching.map((posting) => ({ ...posting, matchFingerprint: null }))
        : matching,
      profile,
      batchSize,
      records,
    ),
    selectedPositions: selected.size,
    positionsWithoutDescriptions: positionIds.filter(
      (positionId) => !positionsWithDescriptions.has(positionId),
    ),
  };
};
