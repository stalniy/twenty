import { defineView } from 'twenty-sdk/define';

import { masterCvRelationView } from '../constants/master-cv-relation-view';

export const masterCvExperienceView = defineView(
  masterCvRelationView({
    name: 'CV experience',
    relation: 'experiences',
    object: 'jobCvExperience',
    fields: [
      ['name', 220],
      ['roleHeld', 200],
      ['startDateText', 140],
      ['endDateText', 140],
      ['technologyStack', 260],
    ],
  }),
);
