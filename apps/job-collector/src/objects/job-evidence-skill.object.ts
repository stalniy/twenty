import { defineObject } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobEvidenceSkill = defineObject(
  cvObject(
    'jobEvidenceSkill',
    'jobEvidenceSkills',
    'Achievement skill',
    'Achievement skills',
    'IconTag',
    {},
  ),
);
