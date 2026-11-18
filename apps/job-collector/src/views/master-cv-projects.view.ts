import { defineView } from 'twenty-sdk/define';

import { masterCvRelationView } from '../constants/master-cv-relation-view';

export const masterCvProjectsView = defineView(
  masterCvRelationView({
    name: 'CV projects',
    relation: 'projects',
    object: 'jobCvProject',
    fields: [
      ['name', 220],
      ['experience', 200],
      ['description', 380],
    ],
  }),
);
