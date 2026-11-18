import { expect, it } from 'vitest';

import { WEIGHTED_REQUIREMENT_SCORING } from '../../services/jd-match-assessment.service';
import { stableRecordId } from '../../utils/stable-record-id.util';
import { type Graphql } from '../record-api';
import { reviewCvRecommendation } from '../review-cv-recommendation';

const ASSESSMENT_ID = stableRecordId('assessment');
const PERSON_ID = stableRecordId('person');
const TARGET_ID = stableRecordId('target');
const RECOMMENDATION_ID = stableRecordId('recommendation');
const ORIGINAL = 'Maintained the database.';
const PROPOSED = 'Maintained the production PostgreSQL database.';
const MATCH_REPORT = JSON.stringify({
  scoringMethod: WEIGHTED_REQUIREMENT_SCORING,
  evidenceRecords: [{ id: TARGET_ID, kind: 'achievement' }],
  recommendations: [
    {
      id: RECOMMENDATION_ID,
      targetId: TARGET_ID,
      kind: 'text',
      original: ORIGINAL,
      proposed: PROPOSED,
    },
  ],
});

const createWorkspace = (initialText = ORIGINAL) => {
  let text = initialText;
  let decision: { id: string; status: string } | undefined;
  const connection = (records: Record<string, unknown>[]) => ({
    edges: records.map((node) => ({ node })),
    pageInfo: { hasNextPage: false, endCursor: null },
  });
  const graphql: Graphql = async <TData>(
    query: string,
    variables: Record<string, unknown> = {},
  ) => {
    const data = variables.data as Record<string, unknown>;
    if (query.includes('jobPersonAssessments('))
      return {
        jobPersonAssessments: connection([
          { id: ASSESSMENT_ID, personId: PERSON_ID, matchReport: MATCH_REPORT },
        ]),
      } as TData;
    if (query.includes('jobCvEvidenceItems('))
      return {
        jobCvEvidenceItems: connection([
          { masterCv: { personId: PERSON_ID }, achievement: text },
        ]),
      } as TData;
    if (query.includes('jobCvRecommendationDecisions('))
      return {
        jobCvRecommendationDecisions: connection(decision ? [decision] : []),
      } as TData;
    if (query.includes('createJobCvRecommendationDecisions(')) {
      decision = (variables.data as (typeof decision)[])[0];
      return {} as TData;
    }
    if (query.includes('updateJobCvEvidenceItems(')) {
      expect(query).toContain(`achievement:{eq:${JSON.stringify(ORIGINAL)}}`);
      text = String(data.achievement);
      return { updateJobCvEvidenceItems: [{ id: TARGET_ID }] } as TData;
    }
    if (query.includes('updateJobCvRecommendationDecision(') && decision) {
      expect(text).toBe(PROPOSED);
      decision.status = String(data.status);
      return {} as TData;
    }
    throw new Error('Unexpected GraphQL operation');
  };
  return { graphql, readText: () => text };
};

it('applies an approved edit once and retains the saved decision on retry', async () => {
  const workspace = createWorkspace();
  const review = () =>
    reviewCvRecommendation(
      workspace.graphql,
      ASSESSMENT_ID,
      RECOMMENDATION_ID,
      'apply',
    );
  await expect(review()).resolves.toBe('applied');
  await expect(review()).resolves.toBe('applied');
  expect(workspace.readText()).toBe(PROPOSED);
});

it('persists dismissal without changing the CV', async () => {
  const workspace = createWorkspace();
  await expect(
    reviewCvRecommendation(
      workspace.graphql,
      ASSESSMENT_ID,
      RECOMMENDATION_ID,
      'dismiss',
    ),
  ).resolves.toBe('dismissed');
  await expect(
    reviewCvRecommendation(
      workspace.graphql,
      ASSESSMENT_ID,
      RECOMMENDATION_ID,
      'apply',
    ),
  ).resolves.toBe('dismissed');
  expect(workspace.readText()).toBe(ORIGINAL);
});

it('preserves a newer CV edit when the proposed wording is stale', async () => {
  const workspace = createWorkspace('A newer edit.');
  await expect(
    reviewCvRecommendation(
      workspace.graphql,
      ASSESSMENT_ID,
      RECOMMENDATION_ID,
      'apply',
    ),
  ).rejects.toThrow('The master CV changed.');
  expect(workspace.readText()).toBe('A newer edit.');
});
