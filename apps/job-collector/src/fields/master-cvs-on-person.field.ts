import { defineField } from 'twenty-sdk/define';

import { cvInverseRelation } from '../constants/cv-metadata';

export const masterCvsOnPerson = defineField(
  cvInverseRelation('person', 'masterCvs'),
);
