import { defineField } from 'twenty-sdk/define';
import { cvInverseRelation } from '../constants/cv-metadata';

export const jobPositionRequirements = defineField(
  cvInverseRelation('jobPosition', 'postingRequirements'),
);
