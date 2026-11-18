import { defineObject, FieldType } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobCvEvidence = defineObject(
  cvObject(
    'jobCvEvidence',
    'jobCvEvidenceItems',
    'CV achievement',
    'CV achievements',
    'IconFileText',
    {
      sourceWording: {
        label: 'Alternate wording in source',
        type: FieldType.TEXT,
      },
      achievement: { label: 'Achievement', type: FieldType.TEXT },
      resumeOrder: { label: 'Resume order', type: FieldType.NUMBER },
    },
  ),
);
