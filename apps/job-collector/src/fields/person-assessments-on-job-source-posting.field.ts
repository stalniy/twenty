import { defineField } from 'twenty-sdk/define';

import { cvInverseRelation } from '../constants/cv-metadata';

export const personAssessmentsOnJobSourcePosting = defineField(
  cvInverseRelation('jobSourcePosting', 'personAssessments'),
);
