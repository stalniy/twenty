import { defineObject, FieldType } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobCvExperience = defineObject(
  cvObject(
    'jobCvExperience',
    'jobCvExperiences',
    'CV experience',
    'CV experiences',
    'IconBriefcase',
    {
      roleHeld: { label: 'Role held', type: FieldType.TEXT },
      startDateText: { label: 'Start date text', type: FieldType.TEXT },
      endDateText: { label: 'End date text', type: FieldType.TEXT },
      description: { label: 'Description', type: FieldType.TEXT },
      technologyStack: { label: 'Technology stack', type: FieldType.TEXT },
      resumeOrder: { label: 'Resume order', type: FieldType.NUMBER },
    },
  ),
);
