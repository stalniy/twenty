import { z } from 'zod';

export const WEIGHTED_REQUIREMENT_SCORING = 'weighted-qualifications-v1';
export const REQUIREMENT_WEIGHTS = {
  'must-have': 2,
  'nice-to-have': 1,
} as const;
export const evidenceText = z.string().trim().min(1).max(6000);
export const matchSchema = z.enum([
  'explicit',
  'semantic',
  'unclear',
  'missing',
]);
export const isSatisfied = (match: z.infer<typeof matchSchema>) =>
  match === 'explicit' || match === 'semantic';

export const cvRecordSchema = z.object({
  id: z.uuid(),
  kind: z.enum(['skill', 'achievement', 'experience', 'project', 'credential']),
  name: evidenceText,
  text: z.string().nullable(),
  skillIds: z.array(z.uuid()),
});

export const proposalSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('text'),
    requirementId: z.uuid(),
    targetId: z.uuid(),
    evidenceIds: z.array(z.uuid()).min(1).max(20),
    original: z.string().max(6000).nullable(),
    proposed: evidenceText,
  }),
  z.object({
    kind: z.literal('skill-link'),
    requirementId: z.uuid(),
    targetId: z.uuid(),
    skillId: z.uuid(),
    evidenceIds: z.array(z.uuid()).min(1).max(20),
  }),
]);

export const assessmentNarrativeSchema = z.object({
  keywords: z
    .array(
      z.object({
        keyword: evidenceText,
        status: z.enum([
          'present',
          'supported-but-absent',
          'unclear',
          'missing',
        ]),
        evidence: evidenceText,
        recommendation: evidenceText,
      }),
    )
    .max(100),
  questions: z.array(evidenceText).max(50),
  recruiterAssessment: evidenceText,
  fitEligibility: z.enum(['POSSIBLE', 'RESTRICTED', 'UNKNOWN']),
  eligibilityReason: evidenceText,
});
