import { type WeightedMatchReport } from '../services/job-requirements.service';
import { WEIGHTED_REQUIREMENT_SCORING } from '../services/jd-match-assessment.service';
import {
  type Graphql,
  createMissingRecords,
  fieldEquals,
  listRecords,
  updateRecord,
} from './record-api';

export const readWeightedReport = (raw: string | null) => {
  try {
    const report: WeightedMatchReport | null = raw ? JSON.parse(raw) : null;
    return report?.scoringMethod === WEIGHTED_REQUIREMENT_SCORING
      ? report
      : null;
  } catch {
    return null;
  }
};

type Decision = { id: string; status: 'applying' | 'applied' | 'dismissed' };
type Recommendation = WeightedMatchReport['recommendations'][number]['id'];
type EvidenceKind = WeightedMatchReport['evidenceRecords'][number]['kind'];

export const CV_RECORD_OBJECTS = {
  skill: { object: 'JobCvSkill', collection: 'jobCvSkills', field: 'name' },
  achievement: {
    object: 'JobCvEvidence',
    collection: 'jobCvEvidenceItems',
    field: 'achievement',
  },
  experience: {
    object: 'JobCvExperience',
    collection: 'jobCvExperiences',
    field: 'description',
  },
  project: {
    object: 'JobCvProject',
    collection: 'jobCvProjects',
    field: 'description',
  },
  credential: {
    object: 'JobCvCredential',
    collection: 'jobCvCredentials',
    field: 'description',
  },
} as const satisfies Record<
  EvidenceKind,
  { object: string; collection: string; field: string }
>;

export const listRecommendationDecisions = (
  graphql: Graphql,
  assessmentId: string,
) =>
  listRecords<Decision>(
    graphql,
    'jobCvRecommendationDecisions',
    'id status',
    fieldEquals('assessmentId', assessmentId),
  );

export const reviewCvRecommendation = async (
  graphql: Graphql,
  assessmentId: string,
  recommendationId: Recommendation,
  action: 'apply' | 'dismiss',
) => {
  const [assessment] = await listRecords<{
    id: string;
    personId: string;
    matchReport: string | null;
  }>(
    graphql,
    'jobPersonAssessments',
    'id personId matchReport',
    fieldEquals('id', assessmentId),
  );
  const report = readWeightedReport(assessment?.matchReport ?? null);
  const proposal = report?.recommendations.find(
    ({ id }) => id === recommendationId,
  );
  const target = report?.evidenceRecords.find(
    ({ id }) => id === proposal?.targetId,
  );
  if (!assessment || !proposal || !target || target.kind === 'skill')
    throw new Error(
      'This recommendation is no longer available. Refresh the assessment.',
    );

  const readDecision = async () =>
    (await listRecommendationDecisions(graphql, assessmentId)).find(
      ({ id }) => id === recommendationId,
    );
  let decision = await readDecision();
  if (decision?.status === 'applied' || decision?.status === 'dismissed')
    return decision.status;

  const record = CV_RECORD_OBJECTS[target.kind];
  const readTarget = async () => {
    const [current] = await listRecords<
      {
        masterCv: { personId: string } | null;
      } & Record<string, unknown>
    >(
      graphql,
      record.collection,
      `masterCv{personId} ${record.field}`,
      fieldEquals('id', target.id),
    );
    if (current?.masterCv?.personId !== assessment.personId)
      throw new Error(
        'The target record is no longer on the assigned master CV.',
      );
    return current[record.field];
  };

  if (action === 'apply') {
    const current = await readTarget();
    const expected =
      proposal.kind === 'text'
        ? proposal.original
        : proposal.originalAchievement;
    if (
      current !== expected &&
      !(
        proposal.kind === 'text' &&
        decision?.status === 'applying' &&
        current === proposal.proposed
      )
    )
      throw new Error(
        'The master CV changed. Reassess this posting before applying the edit.',
      );
  }

  if (!decision) {
    await createMissingRecords(
      graphql,
      'JobCvRecommendationDecision',
      'jobCvRecommendationDecisions',
      [
        {
          id: recommendationId,
          assessmentId,
          name: 'CV recommendation decision',
          status: action === 'apply' ? 'applying' : 'dismissed',
        },
      ],
    );
    decision = await readDecision();
  }
  if (decision?.status === 'applied' || decision?.status === 'dismissed')
    return decision.status;
  if (!decision) throw new Error('Could not load the recommendation decision.');
  if (action === 'dismiss')
    throw new Error('This recommendation is being applied.');

  if (proposal.kind === 'text') {
    const method = `update${record.collection[0].toUpperCase()}${record.collection.slice(1)}`;
    const original =
      proposal.original === null
        ? '{is:NULL}'
        : `{eq:${JSON.stringify(proposal.original)}}`;
    const result = await graphql<Record<string, { id: string }[]>>(
      `mutation Apply($id:UUID!,$data:${record.object}UpdateInput!){${method}(filter:{id:{eq:$id},${record.field}:${original}},data:$data){id}}`,
      { id: target.id, data: { [record.field]: proposal.proposed } },
    );
    if (!result[method].length && (await readTarget()) !== proposal.proposed)
      throw new Error(
        'The master CV changed. Reassess this posting before applying the edit.',
      );
  } else {
    if (
      target.kind !== 'achievement' ||
      (await readTarget()) !== proposal.originalAchievement
    )
      throw new Error(
        'The achievement changed. Reassess this posting before applying the link.',
      );
    const filter = `,filter:{evidenceId:{eq:${JSON.stringify(target.id)}},skillId:{eq:${JSON.stringify(proposal.skillId)}}}`;
    const hasLink = async () =>
      (
        await listRecords<{ id: string }>(
          graphql,
          'jobEvidenceSkills',
          'id',
          filter,
        )
      ).length > 0;
    if (!(await hasLink())) {
      try {
        await createMissingRecords(
          graphql,
          'JobEvidenceSkill',
          'jobEvidenceSkills',
          [
            {
              id: proposal.linkId,
              name: proposal.skillName,
              evidenceId: target.id,
              skillId: proposal.skillId,
            },
          ],
        );
      } catch (error) {
        if (!(await hasLink())) throw error;
      }
    }
  }
  await updateRecord(graphql, 'JobCvRecommendationDecision', decision.id, {
    status: 'applied',
  });
  return 'applied';
};
