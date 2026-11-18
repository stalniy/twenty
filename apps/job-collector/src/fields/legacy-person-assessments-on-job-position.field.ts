import { defineField } from 'twenty-sdk/define';

import { cvInverseRelation } from '../constants/cv-metadata';

export const legacyPersonAssessmentsOnJobPosition = defineField(
  cvInverseRelation('jobPosition', 'legacyPersonAssessments'),
);
