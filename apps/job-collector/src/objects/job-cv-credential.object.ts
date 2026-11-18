import { defineObject, FieldType } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobCvCredential = defineObject(
  cvObject(
    'jobCvCredential',
    'jobCvCredentials',
    'CV credential',
    'CV credentials',
    'IconSchool',
    {
      credentialType: { label: 'Credential type', type: FieldType.TEXT },
      description: { label: 'Description', type: FieldType.TEXT },
      startDateText: { label: 'Start date text', type: FieldType.TEXT },
      endDateText: { label: 'End date text', type: FieldType.TEXT },
      proficiency: { label: 'Proficiency', type: FieldType.TEXT },
      resumeOrder: { label: 'Resume order', type: FieldType.NUMBER },
    },
  ),
);
