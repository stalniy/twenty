import { defineField } from 'twenty-sdk/define';
import { cvInverseRelation } from '../constants/cv-metadata';

export const jobSourcePostingRequirements = defineField(
  cvInverseRelation('jobSourcePosting', 'postingRequirements'),
);
