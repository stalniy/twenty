import { z } from 'zod';

import { WEIGHTED_REQUIREMENT_SCORING } from '../services/jd-match-assessment.service';
import {
  combineRequirementAssessment,
  linkedRequirementsSchema,
} from '../services/job-requirements.service';
import {
  prepareProfileMatches,
  matchingPostingSchema,
} from '../services/profile-matching.service';
import { createMasterCvRepository } from './master-cv-repository';
import {
  listRecommendationDecisions,
  readWeightedReport,
} from './review-cv-recommendation';
import { stableRecordId } from '../utils/stable-record-id.util';
import {
  type Graphql,
  createMissingRecords,
  createRecord,
  fieldEquals,
  listRecords,
  updateRecord,
} from './record-api';

type LegacyAssessment = {
  id: string;
  fitScore: number | null;
  fitReason: string | null;
  fitGaps: string | null;
  fitEligibility: string | null;
  profileMatchedAt: string | null;
  matchReport: string | null;
};

type LegacyPosition = {
  id: string;
  profileFitScore: number | null;
  profileFitReason: string | null;
  profileFitGaps: string | null;
  profileFitEligibility: string | null;
  profileMatchedAt: string | null;
  profileMatchReport: string | null;
};

const recorded = ({
  fitScore,
  fitReason,
  fitGaps,
  fitEligibility,
  profileMatchedAt,
  matchReport,
}: LegacyAssessment) =>
  fitScore != null ||
  [fitReason, fitGaps, fitEligibility, profileMatchedAt, matchReport].some(
    (value) => Boolean(value?.trim()),
  );

const assessmentId = (
  personId: string,
  field: 'sourcePostingId' | 'legacyPositionId',
  jobId: string,
) => stableRecordId(`assessment:${personId}:${field}:${jobId}`);

export const createPersonJobRepository = (graphql: Graphql) => {
  const listLinks = (personId: string) =>
    listRecords<{
      sourcePostingId: string | null;
      jobPositionId: string | null;
    }>(
      graphql,
      'jobPersonLinks',
      'sourcePostingId jobPositionId',
      fieldEquals('personId', personId),
    );

  const listAssessments = (personId: string) =>
    listRecords<{
      id: string;
      sourcePostingId: string | null;
      legacyPositionId: string | null;
      matchFingerprint: string | null;
    }>(
      graphql,
      'jobPersonAssessments',
      'id sourcePostingId legacyPositionId matchFingerprint',
      fieldEquals('personId', personId),
    );

  const linkJobs = async (
    personId: string,
    postingIds: string[],
    positionIds: string[],
  ) => {
    const links = await listLinks(personId);
    const sourcePostingIds = new Set(
      links.map(({ sourcePostingId }) => sourcePostingId),
    );
    const jobPositionIds = new Set(
      links.map(({ jobPositionId }) => jobPositionId),
    );
    await createMissingRecords(graphql, 'JobPersonLink', 'jobPersonLinks', [
      ...postingIds
        .filter((id) => !sourcePostingIds.has(id))
        .map((sourcePostingId) => ({
          id: stableRecordId(
            `assignment:${personId}:source-posting:${sourcePostingId}`,
          ),
          name: 'Source posting assignment',
          personId,
          sourcePostingId,
        })),
      ...positionIds
        .filter((id) => !jobPositionIds.has(id))
        .map((jobPositionId) => ({
          id: stableRecordId(
            `assignment:${personId}:job-position:${jobPositionId}`,
          ),
          name: 'Job Position assignment',
          personId,
          jobPositionId,
        })),
    ]);
  };

  const saveProfileMatch = async (input: unknown) => {
    const { personId, postingId, fingerprint, assessment, linkedJson } = z
      .object({
        personId: z.uuid(),
        postingId: z.uuid(),
        fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
        assessment: z.string().max(500000),
        linkedJson: z
          .string()
          .transform((value) =>
            linkedRequirementsSchema.parse(JSON.parse(value)),
          ),
      })
      .parse(input);
    const [profile, [rawPosting]] = await Promise.all([
      createMasterCvRepository(graphql).readMatchingProfile(personId),
      listRecords<unknown>(
        graphql,
        'jobSourcePostings',
        'id name description location workplaceType salaryText jobPositionId',
        fieldEquals('id', postingId),
      ),
    ]);
    const posting = matchingPostingSchema.parse(rawPosting);
    const [candidate] = prepareProfileMatches(
      [posting],
      profile.text,
      1,
      profile.records,
    ).candidates;
    if (candidate?.fingerprint !== fingerprint)
      throw new Error(
        'The posting or master CV changed during matching. Run matching again.',
      );
    const { report, ...summary } = combineRequirementAssessment(
      linkedJson,
      assessment,
      profile.records,
    );
    const [existing] = await listRecords<{
      id: string;
      matchReport: string | null;
    }>(
      graphql,
      'jobPersonAssessments',
      'id matchReport',
      `,filter:{personId:{eq:${JSON.stringify(personId)}},sourcePostingId:{eq:${JSON.stringify(postingId)}}}`,
    );
    if (existing) {
      const previous = readWeightedReport(existing.matchReport);
      if (previous?.recommendations.length) {
        const currentIds = new Set(report.recommendations.map(({ id }) => id));
        const reviewed = new Set(
          (await listRecommendationDecisions(graphql, existing.id)).map(
            ({ id }) => id,
          ),
        );
        const retained = previous.recommendations.filter(
          ({ id }) => reviewed.has(id) && !currentIds.has(id),
        );
        report.recommendations.push(
          ...retained.map((proposal) => ({ ...proposal, potentialPoints: 0 })),
        );
        const currentRecordIds = new Set(
          report.evidenceRecords.map(({ id }) => id),
        );
        const retainedRecordIds = new Set(
          retained.flatMap(({ targetId, evidenceIds }) => [
            targetId,
            ...evidenceIds,
          ]),
        );
        report.evidenceRecords.push(
          ...previous.evidenceRecords.filter(
            ({ id }) => retainedRecordIds.has(id) && !currentRecordIds.has(id),
          ),
        );
      }
    }
    const summaryFields = {
      ...summary,
      scoringMethod: WEIGHTED_REQUIREMENT_SCORING,
      matchReport: JSON.stringify(report),
      matchFingerprint: fingerprint,
      profileMatchedAt: new Date().toISOString(),
    };
    if (existing) {
      await updateRecord(
        graphql,
        'JobPersonAssessment',
        existing.id,
        summaryFields,
      );
    } else {
      await createRecord(
        graphql,
        'JobPersonAssessment',
        {
          id: assessmentId(personId, 'sourcePostingId', postingId),
          name: 'Source posting assessment',
          personId,
          sourcePostingId: postingId,
          ...summaryFields,
        },
        true,
      );
    }
    return { personId, postingId, fitScore: summary.fitScore };
  };

  const listBackfillJobs = async <TJob extends { id: string }>(
    collection: string,
    fields: string,
  ) => {
    const [active, trashed] = await Promise.all([
      listRecords<TJob>(graphql, collection, fields),
      listRecords<TJob>(
        graphql,
        collection,
        fields,
        ',filter:{deletedAt:{is:NOT_NULL}}',
      ),
    ]);
    return [
      ...new Map([...active, ...trashed].map((job) => [job.id, job])).values(),
    ];
  };

  const backfillJobs = async (personId: string) => {
    const readPostings = () =>
      listBackfillJobs<LegacyAssessment>(
        'jobSourcePostings',
        'id fitScore fitReason fitGaps fitEligibility profileMatchedAt matchReport',
      );
    const readPositions = () =>
      listBackfillJobs<LegacyPosition>(
        'jobpositions',
        'id profileFitScore profileFitReason profileFitGaps profileFitEligibility profileMatchedAt profileMatchReport',
      );
    const [postings, positions, assessments] = await Promise.all([
      readPostings(),
      readPositions(),
      listAssessments(personId),
    ]);
    await linkJobs(
      personId,
      postings.map(({ id }) => id),
      positions.map(({ id }) => id),
    );

    const positionSummaries = positions.map((position) => ({
      id: position.id,
      fitScore: position.profileFitScore,
      fitReason: position.profileFitReason,
      fitGaps: position.profileFitGaps,
      fitEligibility: position.profileFitEligibility,
      profileMatchedAt: position.profileMatchedAt,
      matchReport: position.profileMatchReport,
    }));
    const migrated = (
      records: LegacyAssessment[],
      field: 'sourcePostingId' | 'legacyPositionId',
      name: string,
    ) => {
      const existing = new Set(
        assessments.map((assessment) => assessment[field]),
      );
      return records
        .filter((record) => recorded(record) && !existing.has(record.id))
        .map(({ id, ...record }) => ({
          ...record,
          id: assessmentId(personId, field, id),
          personId,
          [field]: id,
          name,
        }));
    };
    const postingAssessments = migrated(
      postings,
      'sourcePostingId',
      'Legacy Source posting assessment',
    );
    const positionAssessments = migrated(
      positionSummaries,
      'legacyPositionId',
      'Legacy Job Position summary',
    );
    await createMissingRecords(
      graphql,
      'JobPersonAssessment',
      'jobPersonAssessments',
      [...postingAssessments, ...positionAssessments],
    );

    const [currentPostings, currentPositions, links, currentAssessments] =
      await Promise.all([
        listBackfillJobs('jobSourcePostings', 'id'),
        listBackfillJobs('jobpositions', 'id'),
        listLinks(personId),
        listAssessments(personId),
      ]);
    const coverage = (
      records: { id: string }[],
      field: 'sourcePostingId' | 'jobPositionId',
    ) => {
      const linked = new Set(links.map((link) => link[field]));
      const missing = records
        .filter(({ id }) => !linked.has(id))
        .map(({ id }) => id);
      return {
        total: records.length,
        linked: records.length - missing.length,
        missing,
      };
    };
    const missingAssessments = (
      records: LegacyAssessment[],
      field: 'sourcePostingId' | 'legacyPositionId',
    ) => {
      const attributed = new Set(
        currentAssessments.map((assessment) => assessment[field]),
      );
      return records
        .filter((record) => recorded(record) && !attributed.has(record.id))
        .map(({ id }) => id);
    };
    const sourcePostings = coverage(currentPostings, 'sourcePostingId');
    const jobPositions = coverage(currentPositions, 'jobPositionId');
    const unresolvedPostingAssessments = missingAssessments(
      postings,
      'sourcePostingId',
    );
    const unresolvedPositionSummaries = missingAssessments(
      positionSummaries,
      'legacyPositionId',
    );
    return {
      personId,
      sourcePostings,
      jobPositions,
      postingAssessments:
        postings.filter(recorded).length - unresolvedPostingAssessments.length,
      positionSummaries:
        positionSummaries.filter(recorded).length -
        unresolvedPositionSummaries.length,
      unresolvedPostingAssessments,
      unresolvedPositionSummaries,
      complete: ![
        sourcePostings.missing,
        jobPositions.missing,
        unresolvedPostingAssessments,
        unresolvedPositionSummaries,
      ].some((missing) => missing.length),
    };
  };

  return { listAssessments, linkJobs, saveProfileMatch, backfillJobs };
};
