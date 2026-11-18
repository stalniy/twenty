import { defineObject } from 'twenty-sdk/define';
import { cvObject } from '../constants/cv-metadata';

export const jobRequirementSkill = defineObject(
  cvObject(
    'jobRequirementSkill',
    'jobRequirementSkills',
    'Requirement skill',
    'Requirement skills',
    'IconListCheck',
    {},
  ),
);
