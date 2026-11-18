import { defineObject, FieldType } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobCvRecommendationDecision = defineObject(
  cvObject(
    'jobCvRecommendationDecision',
    'jobCvRecommendationDecisions',
    'CV recommendation decision',
    'CV recommendation decisions',
    'IconListCheck',
    { status: { label: 'Status', type: FieldType.TEXT } },
  ),
);
