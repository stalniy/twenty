import { defineObject } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobSkill = defineObject(
  cvObject('jobSkill', 'jobSkills', 'Skill', 'Skills', 'IconTag', {}),
);
