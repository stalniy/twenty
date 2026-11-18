import { WEIGHTED_REQUIREMENT_SCORING } from '../jd-match-assessment.service';
import { describe, expect, it } from 'vitest';

import { DEFAULT_CANDIDATE_RESUME } from '../../constants/candidate-resume';
import { parseMasterCvImport } from '../master-cv-import.service';
import {
  resolveOwnerPerson,
  type MatchingPerson,
} from '../matching-person.service';
import {
  bestAssessmentsByPosition,
  type AssessmentSummary,
} from '../person-assessment.service';

describe('master CV import', () => {
  it('preserves every achievement, dated role, project source and language proficiency', () => {
    const cv = parseMasterCvImport(DEFAULT_CANDIDATE_RESUME);
    const originalBullets = [...DEFAULT_CANDIDATE_RESUME.matchAll(/^• /gm)];
    const achievements = [...cv.experiences, ...cv.projects].flatMap(
      ({ achievements }) => achievements,
    );
    expect(achievements).toHaveLength(originalBullets.length + 1);
    expect(new Set(achievements).size).toBe(achievements.length);
    for (const achievement of achievements) {
      expect(DEFAULT_CANDIDATE_RESUME).toContain(achievement);
    }
    expect(cv.experiences).toHaveLength(11);
    expect(cv.experiences[0]).toMatchObject({
      name: 'Overclock Labs / Akash Network',
      roleHeld: 'Senior Full-stack Engineer',
      startDateText: 'Jan 2025',
      endDateText: 'Sep 2026',
    });
    expect(cv.projects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'AKASH.NETWORK',
          experience: 'Overclock Labs / Akash Network',
        }),
        expect.objectContaining({
          name: 'CASL AND UCAST • AUTHORIZATION TOOLING',
          experience: undefined,
        }),
      ]),
    );
    expect(cv.credentials).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          credentialType: 'Education',
          startDateText: '2006',
          endDateText: '2010',
        }),
        expect.objectContaining({
          credentialType: 'Qualification',
          startDateText: '2012',
          endDateText: '2013',
        }),
        {
          credentialType: 'Language',
          name: 'Ukrainian',
          proficiency: 'Native',
        },
        {
          credentialType: 'Language',
          name: 'English',
          proficiency: 'Advanced',
        },
      ]),
    );
    expect(cv.skills).toContainEqual({
      name: 'Redis',
      skillGroup: 'ADDITIONAL',
    });
    expect(DEFAULT_CANDIDATE_RESUME).toContain(cv.summary);
  });

  it('rejects missing sections before import', () => {
    expect(() =>
      parseMasterCvImport(
        DEFAULT_CANDIDATE_RESUME.replace('SUMMARY', 'PROFILE'),
      ),
    ).toThrow();
  });
});

it('suggests only an unambiguous owner mapping and can resolve a configured owner among several members', () => {
  const name = { firstName: 'Workspace', lastName: 'Owner' };
  const owner = { name, userEmail: 'owner@example.com' };
  const member = { name, userEmail: 'member@example.com' };
  const person: MatchingPerson = {
    id: 'owner',
    name,
    emails: { primaryEmail: null, additionalEmails: ['OWNER@example.com'] },
  };
  expect(resolveOwnerPerson([owner], [person])).toBe(person);
  expect(
    resolveOwnerPerson([owner], [person, { ...person, id: 'duplicate' }]),
  ).toBeUndefined();
  expect(resolveOwnerPerson([owner, member], [person])).toBeUndefined();
  expect(resolveOwnerPerson([owner, member], [person], owner.userEmail)).toBe(
    person,
  );
});

it('selects the best Source posting and retains a position-only result', () => {
  const source: AssessmentSummary = {
    id: 'source',
    fitScore: 80,
    sourcePostingId: 'post',
    sourcePosting: { jobPositionId: 'job' },
    legacyPositionId: null,
    profileMatchedAt: '2026-11-17T12:00:00.000Z',
    matchReport: 'source report',
  };
  const legacy: AssessmentSummary = {
    ...source,
    id: 'legacy',
    fitScore: 100,
    sourcePostingId: null,
    sourcePosting: null,
    legacyPositionId: 'job',
    matchReport: 'legacy report',
  };
  const latest = {
    ...source,
    id: 'latest',
    profileMatchedAt: '2026-11-18T12:00:00.000Z',
  };
  const current = {
    ...source,
    id: 'current',
    fitScore: 0,
    scoringMethod: WEIGHTED_REQUIREMENT_SCORING,
  };
  const noQualifications = { ...current, id: 'empty', fitScore: null };
  const positionOnly = { ...legacy, legacyPositionId: 'position-only' };
  const detached = { ...source, fitScore: 100, sourcePosting: null };
  expect(
    bestAssessmentsByPosition([
      legacy,
      source,
      latest,
      positionOnly,
      detached,
      current,
      noQualifications,
    ]),
  ).toEqual(
    new Map<string, AssessmentSummary>([
      ['job', current],
      ['position-only', positionOnly],
    ]),
  );
});

it('imports the installed JSON schema and keeps one copy of achievements shared by a project and its role', () => {
  const summary = 'Two paragraphs.\n\nOriginal punctuation stays intact.';
  const achievement = 'Architected a metadata-driven CRM platform.';
  const projectWording =
    'Built a dynamic data-querying system combining GraphQL with a query language.';
  const roleWording =
    'Built a dynamic querying system combining GraphQL with a query language.';
  const cv = parseMasterCvImport(
    JSON.stringify({
      source: 'resume.pdf',
      name: 'Example Person',
      headline: 'Staff Engineer',
      location: 'Kraków',
      summary,
      professionalSkills: {
        Languages: ['JavaScript/TypeScript/Node.js'],
        'Languages Spoken': [
          'English (professional working proficiency)',
          'Polish (elementary)',
        ],
      },
      projects: [
        {
          project: 'Knowledge base',
          focus: 'CRM',
          achievements: [achievement, projectWording],
        },
      ],
      experience: [
        {
          employer: 'Infozahyst',
          role: 'Team Lead',
          teamOrProduct: 'CRM',
          dates: '09.2018 - 01.2020',
          achievements: [achievement, roleWording, 'Led the engineering team.'],
        },
      ],
      education: [
        {
          qualification: 'Bachelor’s Degree',
          institution: 'University',
          dates: '2006 - 2010',
        },
      ],
    }),
  );
  expect(cv).toMatchObject({
    targetRole: 'Staff Engineer',
    summary,
    resumeSource: 'resume.pdf',
  });
  expect(cv.projects).toEqual([
    {
      name: 'Knowledge base',
      description: 'CRM',
      experience: 'Infozahyst',
      achievements: [achievement, projectWording],
      alternativeWording: { 1: roleWording },
    },
  ]);
  expect(cv.experiences[0]).toMatchObject({
    name: 'Infozahyst',
    roleHeld: 'Team Lead',
    startDateText: '09.2018',
    endDateText: '01.2020',
    achievements: ['Led the engineering team.'],
  });
  expect(cv.skills.map(({ name }) => name)).toEqual([
    'JavaScript',
    'TypeScript',
    'Node.js',
  ]);
  expect(cv.credentials).toContainEqual({
    name: 'Polish',
    credentialType: 'Language',
    proficiency: 'elementary',
  });
});
