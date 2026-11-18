import { defineObject, FieldType } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobCvSkill = defineObject(
  cvObject('jobCvSkill', 'jobCvSkills', 'CV skill', 'CV skills', 'IconTag', {
    skillGroup: { label: 'Skill group', type: FieldType.TEXT },
    resumeOrder: { label: 'Resume order', type: FieldType.NUMBER },
  }),
);
