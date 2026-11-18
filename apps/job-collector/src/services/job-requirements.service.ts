import { z } from 'zod';

import {
  assessmentNarrativeSchema,
  cvRecordSchema,
  evidenceText,
  isSatisfied,
  matchSchema,
  proposalSchema,
  REQUIREMENT_WEIGHTS,
  WEIGHTED_REQUIREMENT_SCORING,
} from './jd-match-assessment.service';
import { stableRecordId } from '../utils/stable-record-id.util';

export const EXTRACTION_VERSION = 'candidate-qualifications-v2';

const optionSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(150)).max(40),
  criteria: z.array(evidenceText).max(20),
});
const requirementSchema = z.object({
  requirement: evidenceText,
  sourceText: evidenceText,
  sectionHeading: evidenceText.nullable(),
  severity: z.enum(['must-have', 'nice-to-have']),
  priorityInferred: z.boolean(),
  alternatives: z.array(optionSchema).min(1).max(20),
});
export const extractedRequirementsSchema = z.array(requirementSchema).max(200);

export const validateExtraction = (raw: string, description: string) => {
  const rows = extractedRequirementsSchema.parse(JSON.parse(raw));
  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
  const source = normalize(description);
  for (const row of rows) {
    const excerpt = normalize(row.sourceText);
    const heading = row.sectionHeading && normalize(row.sectionHeading);
    if (
      !source.includes(excerpt) ||
      (heading &&
        !source
          .slice(0, source.lastIndexOf(excerpt) + excerpt.length)
          .includes(heading))
    )
      throw new Error(
        'Requirement evidence and heading must quote the posting description.',
      );
    if (
      row.alternatives.some(
        ({ skills, criteria }) => !skills.length && !criteria.length,
      )
    )
      throw new Error('Every requirement alternative must contain a check.');
  }
  return rows;
};

const linkedSkillSchema = z.object({
  id: z.uuid(),
  name: evidenceText,
  evidenceIds: z.array(z.uuid()),
});
const linkedOptionSchema = z.object({
  skills: z.array(linkedSkillSchema),
  criteria: z.array(z.object({ id: z.uuid(), description: evidenceText })),
});
const linkedRequirementSchema = requirementSchema
  .omit({ alternatives: true })
  .extend({
    requirementId: z.uuid(),
    alternatives: z.array(linkedOptionSchema).min(1),
  });
export const linkedRequirementsSchema = z.array(linkedRequirementSchema);
export type LinkedRequirement = z.infer<typeof linkedRequirementSchema>;

const judgmentSchema = z.object({
  checkId: z.uuid(),
  match: matchSchema,
  evidenceIds: z.array(z.uuid()).max(30),
  explanation: evidenceText,
});
export const qualitativeAssessmentSchema = assessmentNarrativeSchema.extend({
  judgments: z.array(judgmentSchema),
  recommendations: z.array(proposalSchema).max(50),
});

const normalizeCriterion = (criterion: string) =>
  criterion
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#]+/gu, ' ')
    .trim();

const scoringKey = (row: LinkedRequirement) => {
  const options = row.alternatives.map(({ skills, criteria }) =>
    JSON.stringify([
      [...new Set(skills.map(({ id }) => id))].sort(),
      [
        ...new Set(
          criteria.map(({ description }) => normalizeCriterion(description)),
        ),
      ].sort(),
    ]),
  );
  return JSON.stringify([row.severity, [...new Set(options)].sort()]);
};

type CvRecord = z.infer<typeof cvRecordSchema>;

export const combineRequirementAssessment = (
  linked: LinkedRequirement[],
  assessmentJson: string,
  records: CvRecord[],
) => {
  const {
    judgments,
    recommendations: proposals,
    ...narrative
  } = qualitativeAssessmentSchema.parse(JSON.parse(assessmentJson));
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const checks = new Map(judgments.map((item) => [item.checkId, item]));
  const expectedChecks = new Set(
    linked.flatMap(({ alternatives }) =>
      alternatives.flatMap(({ criteria }) => criteria.map(({ id }) => id)),
    ),
  );
  if (
    judgments.length !== checks.size ||
    checks.size !== expectedChecks.size ||
    judgments.some(({ checkId }) => !expectedChecks.has(checkId))
  )
    throw new Error('Expected one AI judgment for every qualitative check.');
  for (const judgment of judgments) {
    if (
      judgment.evidenceIds.some((id) => !recordsById.has(id)) ||
      (isSatisfied(judgment.match) && !judgment.evidenceIds.length)
    )
      throw new Error(
        'AI judgments must cite records on the assigned master CV.',
      );
  }

  const groups = new Map<string, LinkedRequirement[]>();
  for (const row of linked) {
    const key = scoringKey(row);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const requirements = [...groups.values()].map((rows) => {
    const [row] = rows;
    const assessments = rows.map(
      ({ requirementId, sourceText, sectionHeading, alternatives }) => ({
        requirementId,
        sourceText,
        sectionHeading,
        alternatives: alternatives.map(({ skills, criteria }) => {
          const skillChecks = skills.map(({ id, name, evidenceIds }) => {
            const validEvidenceIds = evidenceIds.filter((evidenceId) =>
              recordsById.get(evidenceId)?.skillIds.includes(id),
            );
            return {
              id,
              name,
              evidenceIds: validEvidenceIds,
              match: validEvidenceIds.length
                ? ('explicit' as const)
                : ('missing' as const),
            };
          });
          const qualitativeChecks = criteria.map(({ id, description }) => {
            const judgment = checks.get(id);
            if (!judgment) throw new Error('Missing AI judgment.');
            return { description, ...judgment };
          });
          const checksForOption = [...skillChecks, ...qualitativeChecks];
          return {
            skillChecks,
            qualitativeChecks,
            satisfied:
              checksForOption.length > 0 &&
              checksForOption.every(({ match }) => isSatisfied(match)),
            evidenceIds: checksForOption.flatMap(
              ({ evidenceIds }) => evidenceIds,
            ),
          };
        }),
      }),
    );
    const evidenceIds = [
      ...new Set(
        assessments.flatMap(({ alternatives }) =>
          alternatives
            .filter(({ satisfied }) => satisfied)
            .flatMap((option) => option.evidenceIds),
        ),
      ),
    ];
    return {
      requirement: row.requirement,
      severity: row.severity,
      priorityInferred: rows.every((item) => item.priorityInferred),
      assessments,
      satisfied: evidenceIds.length > 0,
      evidenceIds,
    };
  });

  type Proposal = z.infer<typeof proposalSchema>;
  type Recommendation =
    | (Extract<Proposal, { kind: 'text' }> & {
        id: string;
        requirementName: string;
        potentialPoints: number;
        linkId: null;
      })
    | (Extract<Proposal, { kind: 'skill-link' }> & {
        id: string;
        requirementName: string;
        potentialPoints: number;
        linkId: string;
        skillName: string;
        originalAchievement: string;
      });
  const recommendations = proposals.flatMap<Recommendation>((proposal) => {
    const id = stableRecordId(
      JSON.stringify({
        ...proposal,
        evidenceIds: [...new Set(proposal.evidenceIds)].sort(),
      }),
    );
    const requirement = requirements.find((item) =>
      item.assessments.some(
        ({ requirementId }) => requirementId === proposal.requirementId,
      ),
    );
    const target = recordsById.get(proposal.targetId);
    if (
      !requirement ||
      !target ||
      proposal.evidenceIds.some((id) => !recordsById.has(id))
    )
      return [];

    if (proposal.kind === 'text') {
      if (
        target.kind === 'skill' ||
        target.text !== proposal.original ||
        proposal.original === proposal.proposed
      )
        return [];
      return [
        {
          ...proposal,
          id,
          requirementName: requirement.requirement,
          potentialPoints: 0,
          linkId: null,
        },
      ];
    }
    const skill = requirement.assessments
      .flatMap(({ alternatives }) =>
        alternatives.flatMap(({ skillChecks }) => skillChecks),
      )
      .find(({ id }) => id === proposal.skillId);
    if (
      !skill ||
      skill.evidenceIds.length ||
      target.kind !== 'achievement' ||
      !target.text ||
      !proposal.evidenceIds.includes(target.id)
    )
      return [];
    return [
      {
        ...proposal,
        id,
        requirementName: requirement.requirement,
        skillName: skill.name,
        originalAchievement: target.text,
        potentialPoints:
          !requirement.satisfied &&
          requirement.assessments.some(({ alternatives }) =>
            alternatives.some(
              ({ skillChecks, qualitativeChecks }) =>
                skillChecks.some(({ id }) => id === skill.id) &&
                skillChecks.every(
                  ({ id, match }) => id === skill.id || isSatisfied(match),
                ) &&
                qualitativeChecks.every(({ match }) => isSatisfied(match)),
            ),
          )
            ? REQUIREMENT_WEIGHTS[requirement.severity]
            : 0,
        linkId: stableRecordId(`evidence-skill:${target.id}:${skill.id}`),
      },
    ];
  });

  const coverage = (severity: LinkedRequirement['severity']) => {
    const tier = requirements.filter(
      (requirement) => requirement.severity === severity,
    );
    return {
      total: tier.length,
      covered: tier.filter(({ satisfied }) => satisfied).length,
    };
  };
  const mustHave = coverage('must-have');
  const niceToHave = coverage('nice-to-have');
  const earnedPoints =
    REQUIREMENT_WEIGHTS['must-have'] * mustHave.covered +
    REQUIREMENT_WEIGHTS['nice-to-have'] * niceToHave.covered;
  const availablePoints =
    REQUIREMENT_WEIGHTS['must-have'] * mustHave.total +
    REQUIREMENT_WEIGHTS['nice-to-have'] * niceToHave.total;
  const fitScore = availablePoints
    ? Math.round((100 * earnedPoints) / availablePoints)
    : null;
  const usedRecords = new Set([
    ...judgments.flatMap(({ evidenceIds }) => evidenceIds),
    ...linked.flatMap(({ alternatives }) =>
      alternatives.flatMap(({ skills }) =>
        skills.flatMap(({ evidenceIds }) => evidenceIds),
      ),
    ),
    ...recommendations.flatMap(({ targetId, evidenceIds }) => [
      targetId,
      ...evidenceIds,
    ]),
  ]);
  const fitReason = [
    `Must-have coverage: ${mustHave.covered}/${mustHave.total}.`,
    `Nice-to-have coverage: ${niceToHave.covered}/${niceToHave.total}.`,
    `Points: ${earnedPoints}/${availablePoints}.`,
    narrative.recruiterAssessment,
  ].join('\n');
  const fitGaps = [
    ...requirements
      .filter(({ satisfied }) => !satisfied)
      .map(({ requirement, severity }) => `${severity}: ${requirement}`),
    ...narrative.questions,
    narrative.eligibilityReason,
  ].join('\n');
  const report = {
    ...narrative,
    scoringMethod: WEIGHTED_REQUIREMENT_SCORING,
    coverage: { mustHave, niceToHave, earnedPoints, availablePoints },
    requirements,
    recommendations: [
      ...new Map(
        recommendations.map((proposal) => [proposal.id, proposal]),
      ).values(),
    ],
    evidenceRecords: records
      .filter(({ id }) => usedRecords.has(id))
      .map(({ id, kind, name }) => ({ id, kind, name })),
  };
  return {
    fitScore,
    fitReason: fitReason.slice(0, 6000),
    fitGaps: fitGaps.slice(0, 6000),
    fitEligibility: narrative.fitEligibility,
    report,
  };
};

export type WeightedMatchReport = ReturnType<
  typeof combineRequirementAssessment
>['report'];
