import { defineObject, FieldType } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobCvProject = defineObject(
  cvObject(
    'jobCvProject',
    'jobCvProjects',
    'CV project',
    'CV projects',
    'IconFolder',
    {
      description: { label: 'Description', type: FieldType.TEXT },
      resumeOrder: { label: 'Resume order', type: FieldType.NUMBER },
    },
  ),
);
