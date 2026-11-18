import { RestApiClient } from 'twenty-client-sdk/rest';
import { z } from 'zod';
import {
  listRecommendationDecisions,
  reviewCvRecommendation,
} from '../twenty-client/review-cv-recommendation';

import {
  ASSESSMENT_SUMMARY_FIELDS,
  assessmentPositionId,
  bestAssessmentsByPosition,
  type AssessmentSummary,
} from '../services/person-assessment.service';
import {
  MATCHING_MEMBER_FIELDS,
  MATCHING_PERSON_FIELDS,
  resolveOwnerPerson,
  type MatchingPerson,
  type MatchingWorkspaceMember,
} from '../services/matching-person.service';
import {
  type Graphql,
  fieldEquals,
  listRecords,
} from '../twenty-client/record-api';

export type DashboardJob = {
  id: string;
  name: string;
  company: { name: string } | null;
  location: string | null;
  salaryMinimumUsd: number | null;
};

const JOB_FIELDS = 'id name company{name} location salaryMinimumUsd';

export const createDashboardMatchingClient = (
  client = new RestApiClient({ runAs: 'user' }),
) => {
  const graphql: Graphql = async <TData>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<TData> => {
    const response = await client.post<{
      data?: TData;
      errors?: { message: string }[];
    }>('/graphql', { query, variables });
    if (response.errors?.length)
      throw new Error(response.errors.map((error) => error.message).join('; '));
    if (response.data === undefined)
      throw new Error('Twenty returned no data.');
    return response.data;
  };

  const listJobs = (filtered: boolean) =>
    listRecords<DashboardJob>(
      graphql,
      'jobpositions',
      JOB_FIELDS,
      filtered
        ? ',filter:{mentionsTypeScript:{eq:true},or:[{location:{is:NULL}},{location:{eq:""}},{location:{ilike:"%Remote%"}}],salaryMinimumUsd:{gt:100000}}'
        : '',
    );

  const listSelectedJobs = async (
    recordIds: string[],
    recordFilter?: Record<string, unknown>,
  ) => {
    if (recordFilter) {
      return listRecords<DashboardJob>(graphql, 'jobpositions', JOB_FIELDS, {
        type: 'JobpositionFilterInput',
        value: recordFilter,
      });
    }
    const ids = z.array(z.uuid()).max(5000).parse(recordIds);
    const jobs: DashboardJob[] = [];
    for (let offset = 0; offset < ids.length; offset += 100) {
      jobs.push(
        ...(await listRecords<DashboardJob>(
          graphql,
          'jobpositions',
          JOB_FIELDS,
          `,filter:{id:{in:${JSON.stringify(ids.slice(offset, offset + 100))}}}`,
        )),
      );
    }
    return jobs;
  };

  const listPeople = async (ownerEmail?: string) => {
    const [people, members] = await Promise.all([
      listRecords<MatchingPerson>(graphql, 'people', MATCHING_PERSON_FIELDS),
      listRecords<MatchingWorkspaceMember>(
        graphql,
        'workspaceMembers',
        MATCHING_MEMBER_FIELDS,
      ),
    ]);
    return {
      people,
      suggestedPersonId:
        resolveOwnerPerson(members, people, ownerEmail)?.id ?? '',
    };
  };

  const listBestAssessments = async (personId: string) => {
    const filter = fieldEquals('personId', z.uuid().parse(personId));
    const [assessments, masterCvs] = await Promise.all([
      listRecords<AssessmentSummary>(
        graphql,
        'jobPersonAssessments',
        ASSESSMENT_SUMMARY_FIELDS,
        filter,
      ),
      listRecords<{ id: string; importStatus: string | null }>(
        graphql,
        'jobMasterCvs',
        'id importStatus',
        filter,
      ),
    ]);
    const bestAssessments = bestAssessmentsByPosition(assessments);
    const otherAssessments = new Map<string, AssessmentSummary[]>();
    for (const assessment of assessments) {
      const positionId = assessmentPositionId(assessment);
      if (!positionId || bestAssessments.get(positionId)?.id === assessment.id)
        continue;
      const others = otherAssessments.get(positionId);
      if (others) others.push(assessment);
      else otherAssessments.set(positionId, [assessment]);
    }
    return {
      bestAssessments,
      otherAssessments,
      hasMasterCv: masterCvs.some(
        ({ importStatus }) => importStatus !== 'PENDING',
      ),
    };
  };

  const startMatching = async (
    selectedIds: string[],
    single: boolean,
    personId: string,
  ) => {
    const ids = z.array(z.uuid()).min(1).max(5000).parse(selectedIds);
    if (single && ids.length !== 1) throw new Error('Select exactly one job.');
    const assignedPersonId = z.uuid().parse(personId);
    const workflowName = single
      ? 'Match this job to my CV'
      : 'Match selected jobs to my CV';
    const workflows = await listRecords<{
      name: string;
      lastPublishedCoreWorkflowVersionId: string | null;
    }>(graphql, 'coreWorkflows', 'name lastPublishedCoreWorkflowVersionId');
    const versionId = workflows.find(
      ({ name }) => name === workflowName,
    )?.lastPublishedCoreWorkflowVersionId;
    if (!versionId) throw new Error('The matching workflow is not published.');
    const result = await graphql<{
      runCoreWorkflowVersion: { workflowRunId: string };
    }>(
      'mutation DashboardMatch($input:RunCoreWorkflowVersionInput!){runCoreWorkflowVersion(input:$input){workflowRunId}}',
      {
        input: {
          coreWorkflowVersionId: versionId,
          payload: single
            ? { id: ids[0], personId: assignedPersonId }
            : {
                jobpositions: ids.map((id) => ({ id })),
                personId: assignedPersonId,
              },
        },
      },
    );
    return result.runCoreWorkflowVersion.workflowRunId;
  };

  const getRunStatus = async (runId: string) =>
    (
      await listRecords<{ status: string }>(
        graphql,
        'workflowRuns',
        'status',
        fieldEquals('id', z.uuid().parse(runId)),
      )
    )[0]?.status;

  return {
    getRunStatus,
    listRecommendationDecisions: (assessmentId: string) =>
      listRecommendationDecisions(graphql, z.uuid().parse(assessmentId)),
    reviewRecommendation: (
      assessmentId: string,
      recommendationId: string,
      action: 'apply' | 'dismiss',
    ) =>
      reviewCvRecommendation(
        graphql,
        z.uuid().parse(assessmentId),
        z.uuid().parse(recommendationId),
        action,
      ),
    listJobs,
    listSelectedJobs,
    listPeople,
    listBestAssessments,
    startMatching,
  };
};
