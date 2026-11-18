import { defineField } from 'twenty-sdk/define';

import { cvInverseRelation } from '../constants/cv-metadata';

export const personAssignmentsOnJobSourcePosting = defineField(
  cvInverseRelation('jobSourcePosting', 'personAssignments'),
);
