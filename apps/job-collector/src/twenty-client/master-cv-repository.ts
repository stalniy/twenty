import { z } from 'zod';
import { cvRecordSchema } from '../services/jd-match-assessment.service';
import { IMPORTED_EVIDENCE_SKILLS } from '../constants/imported-evidence-skills';
import { parseMasterCvImport } from '../services/master-cv-import.service';
import {
  MATCHING_MEMBER_FIELDS,
  MATCHING_PERSON_FIELDS,
  type MatchingPerson,
  type MatchingWorkspaceMember,
  resolveOwnerPerson,
} from '../services/matching-person.service';
import { skillKey } from '../utils/skill-key.util';
import { stableRecordId } from '../utils/stable-record-id.util';
import {
  type Graphql,
  createMissingRecords,
  fieldEquals,
  listRecords,
  updateRecord,
} from './record-api';

type MasterCv = {
  id: string;
  name: string;
  targetRole: string | null;
  summary: string | null;
  location: string | null;
  importStatus: string | null;
};

type ResumeEntry = {
  id: string;
  name: string;
  resumeOrder: number | null;
};

const byResumeOrder = (left: ResumeEntry, right: ResumeEntry) =>
  (left.resumeOrder ?? Number.MAX_SAFE_INTEGER) -
    (right.resumeOrder ?? Number.MAX_SAFE_INTEGER) ||
  left.name.localeCompare(right.name) ||
  left.id.localeCompare(right.id);

export const createMasterCvRepository = (graphql: Graphql) => {
  const findMasterCv = async (personId: string) =>
    (
      await listRecords<MasterCv>(
        graphql,
        'jobMasterCvs',
        'id name targetRole summary location importStatus',
        fieldEquals('personId', personId),
      )
    )[0];

  const resolvePerson = async (explicitPersonId?: string) => {
    if (explicitPersonId) {
      const [person] = await listRecords<MatchingPerson>(
        graphql,
        'people',
        MATCHING_PERSON_FIELDS,
        fieldEquals('id', explicitPersonId),
      );
      if (!person) throw new Error('The assigned Person does not exist.');
      return person;
    }
    const [members, people] = await Promise.all([
      listRecords<MatchingWorkspaceMember>(
        graphql,
        'workspaceMembers',
        MATCHING_MEMBER_FIELDS,
      ),
      listRecords<MatchingPerson>(graphql, 'people', MATCHING_PERSON_FIELDS),
    ]);
    const person = resolveOwnerPerson(
      members,
      people,
      process.env.JOB_COLLECTOR_OWNER_EMAIL,
    );
    if (!person)
      throw new Error(
        'The workspace owner could not be mapped to one CRM Person. Select a Person to continue.',
      );
    return person;
  };

  const readTargetRole = async (personId: string) => {
    const cv = await findMasterCv(personId);
    if (!cv)
      throw new Error('The assigned Person has no master CV for collection.');
    const targetRole = cv.targetRole?.trim();
    if (!targetRole)
      throw new Error(
        'Set the assigned Person’s master CV Target role before collecting jobs.',
      );
    return targetRole;
  };

  const importResume = async (personId: string) => {
    let cv = await findMasterCv(personId);
    if (cv?.importStatus === 'COMPLETE')
      return { masterCvId: cv.id, imported: false };
    const resume = process.env.CANDIDATE_RESUME;
    if (!resume?.trim())
      throw new Error(
        'Set the installed Job Collector CANDIDATE_RESUME before importing.',
      );
    const { experiences, projects, skills, credentials, ...profile } =
      parseMasterCvImport(resume);
    if (!cv) {
      const id = stableRecordId(`master-cv:${personId}`);
      try {
        await createMissingRecords(graphql, 'JobMasterCv', 'jobMasterCvs', [
          { id, personId, importStatus: 'PENDING', ...profile },
        ]);
      } catch (error) {
        if (!(await findMasterCv(personId))) throw error;
      }
      cv = await findMasterCv(personId);
    }
    if (!cv) throw new Error('Master CV could not be loaded after creation.');
    if (cv.importStatus === 'COMPLETE')
      return { masterCvId: cv.id, imported: false };
    const masterCvId = cv.id;
    const importedId = (kind: string, order: number) =>
      stableRecordId(`${masterCvId}:resume-import:${kind}:${order}`);
    const experienceRecords = experiences.map(
      ({ achievements, alternativeWording, ...experience }, resumeOrder) => ({
        ...experience,
        id: importedId('experience', resumeOrder),
        masterCvId,
        resumeOrder,
      }),
    );
    const projectRecords = projects.map(
      (
        { achievements, alternativeWording, experience, ...project },
        resumeOrder,
      ) => ({
        ...project,
        id: importedId('project', resumeOrder),
        masterCvId,
        resumeOrder,
        experienceId: experienceRecords.find(({ name }) => name === experience)
          ?.id,
      }),
    );
    await createMissingRecords(
      graphql,
      'JobCvExperience',
      'jobCvExperiences',
      experienceRecords,
    );
    await createMissingRecords(
      graphql,
      'JobCvProject',
      'jobCvProjects',
      projectRecords,
    );
    await createMissingRecords(
      graphql,
      'JobCvCredential',
      'jobCvCredentials',
      credentials.map((credential, resumeOrder) => ({
        ...credential,
        id: importedId('credential', resumeOrder),
        masterCvId,
        resumeOrder,
      })),
    );

    const evidenceRecords = [experiences, projects].flatMap((entries, group) =>
      entries.flatMap(
        ({ name, achievements, alternativeWording }, sourceOrder) =>
          achievements.map((achievement, resumeOrder) => ({
            id: stableRecordId(
              `${masterCvId}:resume-import:evidence:${group}:${sourceOrder}:${resumeOrder}`,
            ),
            name: `${name} · ${resumeOrder + 1}`,
            achievement,
            sourceWording: alternativeWording?.[resumeOrder],
            masterCvId,
            personId,
            resumeOrder,
            ...(group === 0
              ? { experienceId: experienceRecords[sourceOrder].id }
              : { projectId: projectRecords[sourceOrder].id }),
          })),
      ),
    );
    await createMissingRecords(
      graphql,
      'JobCvEvidence',
      'jobCvEvidenceItems',
      evidenceRecords,
    );

    const skillsByName = new Map(
      (
        await listRecords<{ id: string; name: string }>(
          graphql,
          'jobSkills',
          'id name',
        )
      )
        .sort((left, right) => right.id.localeCompare(left.id))
        .map((skill) => [skillKey(skill.name), skill.id]),
    );
    const inferredSkills = IMPORTED_EVIDENCE_SKILLS.flatMap(
      ([name, pattern]) =>
        evidenceRecords.some(({ achievement }) => pattern.test(achievement))
          ? [{ name, skillGroup: 'EVIDENCE' }]
          : [],
    );
    const listedSkillNames = new Set(skills.map(({ name }) => skillKey(name)));
    const skillRecords = [
      ...skills,
      ...inferredSkills.filter(
        ({ name }) => !listedSkillNames.has(skillKey(name)),
      ),
    ].map(({ name, skillGroup }, resumeOrder) => ({
      name,
      skillGroup,
      resumeOrder,
      id:
        skillsByName.get(skillKey(name)) ??
        stableRecordId(`workspace-skill:${skillKey(name)}`),
    }));
    await createMissingRecords(graphql, 'JobSkill', 'jobSkills', [
      ...new Map(
        skillRecords.map(({ id, name }) => [id, { id, name }]),
      ).values(),
    ]);
    const existingCvSkills = new Set(
      (
        await listRecords<{ skillId: string | null }>(
          graphql,
          'jobCvSkills',
          'skillId',
          fieldEquals('masterCvId', masterCvId),
        )
      ).map(({ skillId }) => skillId),
    );
    await createMissingRecords(graphql, 'JobCvSkill', 'jobCvSkills', [
      ...new Map(
        skillRecords
          .filter(({ id }) => !existingCvSkills.has(id))
          .map(({ id: skillId, ...skill }) => [
            skillId,
            {
              ...skill,
              id: stableRecordId(`cv-skill:${masterCvId}:${skillId}`),
              masterCvId,
              skillId,
            },
          ]),
      ).values(),
    ]);
    await createMissingRecords(
      graphql,
      'JobEvidenceSkill',
      'jobEvidenceSkills',
      evidenceRecords.flatMap(({ id: evidenceId, achievement }) =>
        skillRecords
          .filter(({ name }) => {
            const knownEvidence = IMPORTED_EVIDENCE_SKILLS.find(
              ([skill]) => skill === name,
            );
            if (knownEvidence?.[1].test(achievement)) return true;
            return name.split('/').some((alias) => {
              const escaped = alias
                .replace(/\*$/, '')
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              return new RegExp(
                `(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`,
                'iu',
              ).test(achievement);
            });
          })
          .map(({ id: skillId, name }) => ({
            id: stableRecordId(`evidence-skill:${evidenceId}:${skillId}`),
            name,
            evidenceId,
            skillId,
          })),
      ),
    );
    await updateRecord(graphql, 'JobMasterCv', masterCvId, {
      importStatus: 'COMPLETE',
    });
    return { masterCvId, imported: true };
  };

  const readMatchingProfile = async (personId: string) => {
    const cv = await findMasterCv(personId);
    if (!cv || cv.importStatus === 'PENDING') {
      throw new Error(
        'The assigned Person has no completed master CV. Create or finish importing it before matching.',
      );
    }
    const cvFilter = fieldEquals('masterCvId', cv.id);
    const [experiences, projects, credentials, evidence, cvSkills] =
      await Promise.all([
        listRecords<
          ResumeEntry & {
            roleHeld: string | null;
            startDateText: string | null;
            endDateText: string | null;
            description: string | null;
            technologyStack: string | null;
          }
        >(
          graphql,
          'jobCvExperiences',
          'id name resumeOrder roleHeld startDateText endDateText description technologyStack',
          cvFilter,
        ),
        listRecords<
          ResumeEntry & {
            experienceId: string | null;
            description: string | null;
          }
        >(
          graphql,
          'jobCvProjects',
          'id name resumeOrder experienceId description',
          cvFilter,
        ),
        listRecords<
          ResumeEntry & {
            credentialType: string | null;
            description: string | null;
            startDateText: string | null;
            endDateText: string | null;
            proficiency: string | null;
          }
        >(
          graphql,
          'jobCvCredentials',
          'id name resumeOrder credentialType description startDateText endDateText proficiency',
          cvFilter,
        ),
        listRecords<
          ResumeEntry & {
            experienceId: string | null;
            projectId: string | null;
            achievement: string | null;
          }
        >(
          graphql,
          'jobCvEvidenceItems',
          'id name resumeOrder experienceId projectId achievement',
          `,filter:{masterCvId:{eq:${JSON.stringify(cv.id)}},personId:{eq:${JSON.stringify(personId)}}}`,
        ),
        listRecords<
          ResumeEntry & {
            skillGroup: string | null;
            skill: { id: string; name: string } | null;
          }
        >(
          graphql,
          'jobCvSkills',
          'id name resumeOrder skillGroup skill{id name}',
          cvFilter,
        ),
      ]);
    const experienceIds = new Set(experiences.map(({ id }) => id));
    const validProjects = projects.filter(
      ({ experienceId }) => !experienceId || experienceIds.has(experienceId),
    );
    const projectIds = new Set(validProjects.map(({ id }) => id));
    const scopedEvidence = evidence.filter(({ experienceId, projectId }) =>
      projectId
        ? !experienceId && projectIds.has(projectId)
        : Boolean(experienceId && experienceIds.has(experienceId)),
    );
    const evidenceSkills = new Map<string, { id: string; name: string }[]>();
    for (let offset = 0; offset < scopedEvidence.length; offset += 100) {
      const ids = scopedEvidence
        .slice(offset, offset + 100)
        .map(({ id }) => id);
      const links = await listRecords<{
        evidenceId: string;
        skill: { id: string; name: string } | null;
      }>(
        graphql,
        'jobEvidenceSkills',
        'evidenceId skill{id name}',
        `,filter:{evidenceId:{in:${JSON.stringify(ids)}}}`,
      );
      for (const { evidenceId, skill } of links) {
        if (skill)
          evidenceSkills.set(evidenceId, [
            ...(evidenceSkills.get(evidenceId) ?? []),
            skill,
          ]);
      }
    }
    const renderEvidence = (sourceId: string) =>
      scopedEvidence
        .filter(
          ({ experienceId, projectId }) =>
            (projectId ?? experienceId) === sourceId,
        )
        .sort(byResumeOrder)
        .flatMap(({ id, achievement }) => {
          if (!achievement) return [];
          const skills = evidenceSkills
            .get(id)
            ?.map(({ name }) => name)
            .sort()
            .join(', ');
          return [
            `• [${id}] ${achievement}${skills ? `\n  Evidence for: ${skills}` : ''}`,
          ];
        });
    const renderProject = (project: (typeof projects)[number]) => [
      project.name,
      `Record: ${project.id}`,
      project.description,
      ...renderEvidence(project.id),
    ];
    const text = [
      cv.name,
      cv.targetRole,
      cv.location,
      'SUMMARY',
      cv.summary,
      'EXPERIENCE',
      ...experiences.sort(byResumeOrder).flatMap((experience) => [
        [
          experience.name,
          experience.roleHeld,
          [experience.startDateText, experience.endDateText]
            .filter(Boolean)
            .join(' - '),
        ]
          .filter(Boolean)
          .join(' / '),
        experience.description,
        ...renderEvidence(experience.id),
        experience.technologyStack && `Stack: ${experience.technologyStack}`,
        ...validProjects
          .filter(({ experienceId }) => experienceId === experience.id)
          .sort(byResumeOrder)
          .flatMap(renderProject),
      ]),
      'PROJECTS',
      ...validProjects
        .filter(({ experienceId }) => !experienceId)
        .sort(byResumeOrder)
        .flatMap(renderProject),
      'SKILLS',
      ...cvSkills
        .sort(byResumeOrder)
        .flatMap(({ id, skill, skillGroup }) =>
          skill
            ? [`• [${id}] ${skill.name}${skillGroup ? ` (${skillGroup})` : ''}`]
            : [],
        ),
      'EDUCATION, QUALIFICATIONS & LANGUAGES',
      ...credentials
        .sort(byResumeOrder)
        .map(
          ({
            id,
            name,
            credentialType,
            description,
            startDateText,
            endDateText,
            proficiency,
          }) =>
            [
              credentialType,
              name,
              `Record: ${id}`,
              description,
              [startDateText, endDateText].filter(Boolean).join(' - '),
              proficiency,
            ]
              .filter(Boolean)
              .join(' · '),
        ),
    ]
      .filter(Boolean)
      .join('\n');
    const records: z.infer<typeof cvRecordSchema>[] = [
      ...cvSkills.flatMap(({ id, skill }) =>
        skill
          ? [
              {
                id,
                name: skill.name,
                kind: 'skill' as const,
                text: null,
                skillIds: [skill.id],
              },
            ]
          : [],
      ),
      ...scopedEvidence.map(({ id, name, achievement }) => ({
        id,
        name,
        kind: 'achievement' as const,
        text: achievement,
        skillIds: [
          ...new Set((evidenceSkills.get(id) ?? []).map((skill) => skill.id)),
        ].sort(),
      })),
      ...experiences.map(({ id, name, description }) => ({
        id,
        name,
        kind: 'experience' as const,
        text: description,
        skillIds: [],
      })),
      ...validProjects.map(({ id, name, description }) => ({
        id,
        name,
        kind: 'project' as const,
        text: description,
        skillIds: [],
      })),
      ...credentials.map(({ id, name, description }) => ({
        id,
        name,
        kind: 'credential' as const,
        text: description,
        skillIds: [],
      })),
    ];
    return {
      text,
      records: records.sort((left, right) => left.id.localeCompare(right.id)),
    };
  };

  return { resolvePerson, importResume, readMatchingProfile, readTargetRole };
};
