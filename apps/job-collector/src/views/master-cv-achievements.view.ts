import { defineView } from 'twenty-sdk/define';

import { masterCvRelationView } from '../constants/master-cv-relation-view';

export const masterCvAchievementsView = defineView(
  masterCvRelationView({
    name: 'CV achievements',
    relation: 'achievements',
    object: 'jobCvEvidence',
    fields: [
      ['name', 240],
      ['achievement', 380],
      ['experience', 200],
      ['project', 200],
    ],
  }),
);
