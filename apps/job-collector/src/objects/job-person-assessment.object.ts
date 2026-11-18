import { defineObject, FieldType } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobPersonAssessment = defineObject(
  cvObject(
    'jobPersonAssessment',
    'jobPersonAssessments',
    'Job assessment',
    'Job assessments',
    'IconListCheck',
    {
      scoringMethod: { label: 'Scoring method', type: FieldType.TEXT },
      fitScore: { label: 'Fit score', type: FieldType.NUMBER },
      fitReason: { label: 'Fit reason', type: FieldType.TEXT },
      fitGaps: { label: 'Fit gaps', type: FieldType.TEXT },
      fitEligibility: { label: 'Fit eligibility', type: FieldType.TEXT },
      profileMatchedAt: {
        label: 'Profile matched at',
        type: FieldType.DATE_TIME,
      },
      matchReport: { label: 'Match report', type: FieldType.TEXT },
      matchFingerprint: { label: 'Match fingerprint', type: FieldType.TEXT },
    },
  ),
);
