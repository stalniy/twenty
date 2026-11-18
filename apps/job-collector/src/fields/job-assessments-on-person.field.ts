import { defineField } from 'twenty-sdk/define';

import { cvInverseRelation } from '../constants/cv-metadata';

export const jobAssessmentsOnPerson = defineField(
  cvInverseRelation('person', 'jobAssessments'),
);
