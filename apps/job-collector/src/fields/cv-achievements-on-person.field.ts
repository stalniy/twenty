import { defineField } from 'twenty-sdk/define';

import { cvInverseRelation } from '../constants/cv-metadata';

export const cvAchievementsOnPerson = defineField(
  cvInverseRelation('person', 'cvAchievements'),
);
