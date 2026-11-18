import { defineField } from 'twenty-sdk/define';

import { cvInverseRelation } from '../constants/cv-metadata';

export const personAssignmentsOnJobPosition = defineField(
  cvInverseRelation('jobPosition', 'personAssignments'),
);
