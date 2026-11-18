import { expect, it } from 'vitest';

import {
  combineRequirementAssessment,
  type LinkedRequirement,
  validateExtraction,
} from '../job-requirements.service';
import { stableRecordId } from '../../utils/stable-record-id.util';
import { JD_MATCH_ASSESSMENT } from './jd-match-fixture';

const EXPERIENCE = {
  id: stableRecordId('experience'),
  kind: 'experience' as const,
  name: 'Platform Engineering',
  text: 'Maintained PostgreSQL in production for two years.',
  skillIds: [],
};
const POSTGRESQL = { id: stableRecordId('postgresql'), name: 'PostgreSQL' };
const CV_SKILL = {
  id: stableRecordId('cv-skill'),
  kind: 'skill' as const,
  name: POSTGRESQL.name,
  text: null,
  skillIds: [POSTGRESQL.id],
};
const DURATION = {
  id: stableRecordId('duration'),
  description: 'Five years of production use',
};
const REQUIREMENT: LinkedRequirement = {
  requirementId: stableRecordId('requirement'),
  requirement: 'Five years of PostgreSQL in production',
  sourceText: 'At least five years of PostgreSQL in production.',
  sectionHeading: 'Minimum qualifications',
  priorityInferred: false,
  severity: 'must-have',
  alternatives: [
    {
      skills: [{ ...POSTGRESQL, evidenceIds: [CV_SKILL.id] }],
      criteria: [DURATION],
    },
  ],
};

it('validates quotes, section context, and empty qualifications', () => {
  const extracted = {
    ...REQUIREMENT,
    alternatives: [
      { skills: ['PostgreSQL'], criteria: [DURATION.description] },
    ],
  };
  const description =
    'Our stack\nJava\nMinimum qualifications\n' + REQUIREMENT.sourceText;
  expect(
    validateExtraction(JSON.stringify([extracted]), description),
  ).toHaveLength(1);
  expect(validateExtraction('[]', 'You will work on Java services.')).toEqual(
    [],
  );
  expect(() =>
    validateExtraction(JSON.stringify([extracted]), 'Java only'),
  ).toThrow(/quote/);
  expect(() =>
    validateExtraction(JSON.stringify([extracted]), REQUIREMENT.sourceText),
  ).toThrow(/quote/);
  expect(() =>
    validateExtraction(
      JSON.stringify([
        { ...extracted, alternatives: [{ skills: [], criteria: [] }] },
      ]),
      description,
    ),
  ).toThrow(/contain a check/);
});

it('records a successful skill check alongside a duration gap without granting partial credit', () => {
  const assessment = JSON.stringify({
    ...JD_MATCH_ASSESSMENT,
    judgments: [
      {
        checkId: DURATION.id,
        match: 'missing',
        evidenceIds: [EXPERIENCE.id],
        explanation: 'Only two years are recorded.',
      },
    ],
  });
  const result = combineRequirementAssessment([REQUIREMENT], assessment, [
    EXPERIENCE,
    CV_SKILL,
  ]);
  expect(result.fitScore).toBe(0);
  expect(result.report.coverage).toMatchObject({
    earnedPoints: 0,
    availablePoints: 2,
  });
  expect(
    result.report.requirements[0].assessments[0].alternatives[0],
  ).toMatchObject({
    satisfied: false,
    skillChecks: [{ match: 'explicit', evidenceIds: [CV_SKILL.id] }],
    qualitativeChecks: [{ match: 'missing', evidenceIds: [EXPERIENCE.id] }],
  });
});

it('honors OR branches, counts repeated skills once per tier, and retains their posting links', () => {
  const optional: LinkedRequirement = {
    ...REQUIREMENT,
    requirementId: stableRecordId('optional'),
    severity: 'nice-to-have',
    alternatives: [
      {
        skills: [
          { id: stableRecordId('mysql'), name: 'MySQL', evidenceIds: [] },
        ],
        criteria: [],
      },
      { skills: [{ ...POSTGRESQL, evidenceIds: [CV_SKILL.id] }], criteria: [] },
    ],
  };
  const result = combineRequirementAssessment(
    [
      REQUIREMENT,
      optional,
      {
        ...optional,
        requirementId: stableRecordId('repeated'),
        alternatives: [...optional.alternatives].reverse(),
      },
    ],
    JSON.stringify({
      ...JD_MATCH_ASSESSMENT,
      judgments: [
        {
          checkId: DURATION.id,
          match: 'unclear',
          evidenceIds: [],
          explanation: 'Duration unknown.',
        },
      ],
    }),
    [CV_SKILL],
  );
  expect(result.fitScore).toBe(33);
  expect(result.report.coverage).toEqual({
    earnedPoints: 1,
    availablePoints: 3,
    mustHave: { covered: 0, total: 1 },
    niceToHave: { covered: 1, total: 1 },
  });
  expect(result.report.requirements[1]).toMatchObject({
    evidenceIds: [CV_SKILL.id],
    assessments: [
      { requirementId: optional.requirementId },
      { requirementId: stableRecordId('repeated') },
    ],
  });
});

it('rejects missing judgments and satisfied judgments without evidence on the assigned CV', () => {
  for (const evidenceIds of [[], [stableRecordId('foreign-record')]]) {
    expect(() =>
      combineRequirementAssessment(
        [REQUIREMENT],
        JSON.stringify({
          ...JD_MATCH_ASSESSMENT,
          judgments: [
            {
              checkId: DURATION.id,
              match: 'semantic',
              evidenceIds,
              explanation: 'Claimed match.',
            },
          ],
        }),
        [CV_SKILL],
      ),
    ).toThrow(/assigned master CV/);
  }
  expect(() =>
    combineRequirementAssessment(
      [REQUIREMENT],
      JSON.stringify(JD_MATCH_ASSESSMENT),
      [CV_SKILL],
    ),
  ).toThrow(/one AI judgment/);
});

it('uses both deterministic and qualitative evidence in the numerator', () => {
  const result = combineRequirementAssessment(
    [REQUIREMENT],
    JSON.stringify({
      ...JD_MATCH_ASSESSMENT,
      judgments: [
        {
          checkId: DURATION.id,
          match: 'semantic',
          evidenceIds: [EXPERIENCE.id],
          explanation: 'Duration established.',
        },
      ],
    }),
    [CV_SKILL, EXPERIENCE],
  );
  expect(result.fitScore).toBe(100);
  expect(result.report.requirements[0].evidenceIds).toEqual([
    CV_SKILL.id,
    EXPERIENCE.id,
  ]);
});

it('proposes a Skill link supported by an achievement and only projects newly achievable points', () => {
  const achievement = {
    ...EXPERIENCE,
    kind: 'achievement' as const,
  };
  const requirement = {
    ...REQUIREMENT,
    alternatives: [
      { skills: [{ ...POSTGRESQL, evidenceIds: [] }], criteria: [] },
    ],
  };
  const bothProposals = JSON.stringify({
    ...JD_MATCH_ASSESSMENT,
    recommendations: [
      {
        kind: 'skill-link',
        requirementId: REQUIREMENT.requirementId,
        targetId: achievement.id,
        skillId: POSTGRESQL.id,
        evidenceIds: [achievement.id],
      },
      {
        kind: 'text',
        requirementId: REQUIREMENT.requirementId,
        targetId: achievement.id,
        original: achievement.text,
        proposed: 'Supported production PostgreSQL for two years.',
        evidenceIds: [achievement.id],
      },
    ],
  });
  const result = combineRequirementAssessment([requirement], bothProposals, [
    achievement,
  ]);
  expect(result.fitScore).toBe(0);
  expect(result.report.recommendations).toMatchObject([
    { kind: 'skill-link', skillName: 'PostgreSQL', potentialPoints: 2 },
    { kind: 'text', potentialPoints: 0 },
  ]);
});
