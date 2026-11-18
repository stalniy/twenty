import { z } from 'zod';

import {
  EXTRACTION_VERSION,
  validateExtraction,
} from '../services/job-requirements.service';
import { cvRecordSchema } from '../services/jd-match-assessment.service';
import { skillKey } from '../utils/skill-key.util';
import { stableRecordId } from '../utils/stable-record-id.util';
import {
  createMissingRecords,
  fieldEquals,
  listRecords,
  type Graphql,
  updateRecord,
} from './record-api';

export const createJobRequirementsRepository = (graphql: Graphql) => {
  const extractionKey = (postingId: string, extractionPrompt: string) =>
    stableRecordId(
      JSON.stringify([EXTRACTION_VERSION, postingId, extractionPrompt]),
    );
  const markCachedExtractions = async <
    TCandidate extends { postingId: string; extractionPrompt: string },
  >(
    candidates: TCandidate[],
  ) => {
    const ids = candidates.map((item) =>
      extractionKey(item.postingId, item.extractionPrompt),
    );
    const existing = ids.length
      ? await listRecords<{ id: string }>(
          graphql,
          'jobRequirementExtractions',
          'id',
          `,filter:{id:{in:${JSON.stringify(ids)}}}`,
        )
      : [];
    const cached = new Set(existing.map((row) => row.id));
    return candidates.map((item, index) => ({
      ...item,
      cachedExtraction: cached.has(ids[index]) ? ids[index] : '',
    }));
  };
  const matchRequirements = async (input: {
    postingId: string;
    extractionPrompt: string;
    requirements: string;
    cvRecordsJson: string;
  }) => {
    const postingId = z.uuid().parse(input.postingId);
    const posting = z
      .object({ title: z.string(), description: z.string() })
      .parse(JSON.parse(input.extractionPrompt));
    const cvRecords = z
      .array(cvRecordSchema)
      .parse(JSON.parse(input.cvRecordsJson));
    const evidenceBySkill = new Map<string, string[]>();
    for (const record of cvRecords) {
      for (const skillId of record.skillIds) {
        evidenceBySkill.set(skillId, [
          ...(evidenceBySkill.get(skillId) ?? []),
          record.id,
        ]);
      }
    }
    const [current] = await listRecords<{
      name: string;
      description: string;
      jobPositionId: string | null;
    }>(
      graphql,
      'jobSourcePostings',
      'name description jobPositionId',
      fieldEquals('id', postingId),
    );
    if (
      !current ||
      current.name !== posting.title ||
      current.description !== posting.description
    )
      throw new Error('Posting changed during extraction. Run matching again.');

    const extractionId = extractionKey(postingId, input.extractionPrompt);
    const readExtraction = async () =>
      (
        await listRecords<{ requirementsJson: string }>(
          graphql,
          'jobRequirementExtractions',
          'requirementsJson',
          fieldEquals('id', extractionId),
        )
      )[0];
    let extraction = await readExtraction();
    if (!extraction) {
      const requirements = validateExtraction(
        input.requirements,
        posting.description,
      );
      await createMissingRecords(
        graphql,
        'JobRequirementExtraction',
        'jobRequirementExtractions',
        [
          {
            id: extractionId,
            name: posting.title,
            requirementsJson: JSON.stringify(requirements),
          },
        ],
      );
      extraction = await readExtraction();
    }
    if (!extraction) throw new Error('Could not load the saved requirements.');
    const rows = validateExtraction(
      extraction.requirementsJson,
      posting.description,
    );
    const catalog = await listRecords<{ id: string; name: string }>(
      graphql,
      'jobSkills',
      'id name',
    );
    const skillsByKey = new Map<string, { id: string; name: string }[]>();
    for (const skill of catalog.sort((left, right) =>
      left.id.localeCompare(right.id),
    )) {
      const key = skillKey(skill.name);
      skillsByKey.set(key, [...(skillsByKey.get(key) ?? []), skill]);
    }
    const newSkills = new Map<string, { id: string; name: string }>();
    const linked = rows.flatMap((row) => {
      const options = row.alternatives.map((option) => {
        const skills = [
          ...new Map(
            option.skills.map((name) => {
              const key = skillKey(name);
              const existing = skillsByKey.get(key);
              const skill = existing?.[0] ??
                newSkills.get(key) ?? {
                  id: stableRecordId('workspace-skill:' + key),
                  name,
                };
              if (!existing) newSkills.set(key, skill);
              return [
                skill.id,
                { ...skill, evidenceIds: evidenceBySkill.get(skill.id) ?? [] },
              ];
            }),
          ).values(),
        ];
        return { skills, criteria: option.criteria };
      });
      const [onlyOption] = options;
      const units =
        options.length === 1 && onlyOption.criteria.length === 0
          ? onlyOption.skills.map((skill) => [
              { skills: [skill], criteria: [] },
            ])
          : [options];
      return units.map((alternatives, unitIndex) => {
        const requirementId = stableRecordId(
          JSON.stringify([
            extractionId,
            row,
            unitIndex,
            alternatives.map(({ skills }) => skills.map(({ id }) => id)),
          ]),
        );
        return {
          ...row,
          requirement:
            units.length > 1 ? alternatives[0].skills[0].name : row.requirement,
          requirementId,
          alternatives: alternatives.map(
            ({ skills, criteria }, optionIndex) => ({
              skills,
              criteria: criteria.map((description, checkIndex) => ({
                id: stableRecordId(
                  JSON.stringify([requirementId, optionIndex, checkIndex]),
                ),
                description,
              })),
            }),
          ),
        };
      });
    });
    const distinctLinked = [
      ...new Map(linked.map((row) => [row.requirementId, row])).values(),
    ];
    await createMissingRecords(graphql, 'JobSkill', 'jobSkills', [
      ...newSkills.values(),
    ]);
    const previous = await listRecords<{
      id: string;
      jobPositionId: string | null;
    }>(
      graphql,
      'jobRequirements',
      'id jobPositionId',
      fieldEquals('sourcePostingId', postingId),
    );
    await createMissingRecords(
      graphql,
      'JobRequirement',
      'jobRequirements',
      distinctLinked.map((row) => ({
        id: row.requirementId,
        name: row.requirement,
        sourceText: row.sourceText,
        severity: row.severity,
        priorityInferred: row.priorityInferred,
        responsibility: false,
        sectionHeading: row.sectionHeading,
        assessmentMethod: row.alternatives.some(
          ({ criteria }) => criteria.length,
        )
          ? 'experience'
          : 'skill',
        skillRule: row.alternatives.length > 1 ? 'any' : 'all',
        sourcePostingId: postingId,
        jobPositionId: current.jobPositionId,
      })),
    );
    await createMissingRecords(
      graphql,
      'JobRequirementSkill',
      'jobRequirementSkills',
      distinctLinked.flatMap((row) =>
        [
          ...new Map(
            row.alternatives.flatMap(({ skills }) =>
              skills.map((skill) => [skill.id, skill] as const),
            ),
          ).values(),
        ].map((skill) => ({
          id: stableRecordId(row.requirementId + ':' + skill.id),
          name: skill.name,
          requirementId: row.requirementId,
          skillId: skill.id,
        })),
      ),
    );
    const activeIds = new Set(distinctLinked.map((row) => row.requirementId));
    for (const record of previous) {
      const positionId = activeIds.has(record.id)
        ? current.jobPositionId
        : null;
      if (record.jobPositionId !== positionId)
        await updateRecord(graphql, 'JobRequirement', record.id, {
          jobPositionId: positionId,
        });
    }
    return {
      linkedJson: JSON.stringify(distinctLinked),
    };
  };
  return { matchRequirements, markCachedExtractions };
};
