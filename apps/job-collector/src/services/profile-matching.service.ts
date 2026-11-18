import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  cvRecordSchema,
  WEIGHTED_REQUIREMENT_SCORING,
} from './jd-match-assessment.service';
import { EXTRACTION_VERSION } from './job-requirements.service';

export const matchingPostingSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  workplaceType: z.string().nullable(),
  salaryText: z.string().nullable(),
  matchFingerprint: z.string().nullable().optional(),
  jobPositionId: z.uuid().nullable().optional(),
});

export type MatchingPosting = z.infer<typeof matchingPostingSchema>;

export const matchingBatchSize = () =>
  z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .parse(process.env.MATCH_BATCH_SIZE || '25');

export const prepareProfileMatches = (
  postings: MatchingPosting[],
  profile: string,
  batchSize: number,
  records: z.infer<typeof cvRecordSchema>[] = [],
) => {
  const pending = postings.flatMap((posting) => {
    if (!posting.description?.trim()) return [];
    const evidence = {
      title: posting.name,
      description: posting.description,
      location: posting.location,
      workplaceType: posting.workplaceType,
      salary: posting.salaryText,
    };
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          assessmentVersion: WEIGHTED_REQUIREMENT_SCORING,
          extractionVersion: EXTRACTION_VERSION,
          records,
          positionId: posting.jobPositionId,
          profile,
          evidence,
        }),
      )
      .digest('hex');
    if (fingerprint === posting.matchFingerprint) return [];
    return [
      {
        postingId: posting.id,
        extractionPrompt: JSON.stringify({
          title: posting.name,
          description: posting.description,
        }),
        fingerprint,
        prompt: JSON.stringify({
          resume: { text: profile, records },
          posting: evidence,
        }),
      },
    ];
  });
  return {
    candidates: pending.slice(0, batchSize),
    pending: pending.length,
    remaining: Math.max(0, pending.length - batchSize),
  };
};
