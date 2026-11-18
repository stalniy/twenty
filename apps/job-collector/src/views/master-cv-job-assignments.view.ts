import { defineView } from 'twenty-sdk/define';

import { masterCvRelationView } from '../constants/master-cv-relation-view';

export const masterCvJobAssignmentsView = defineView(
  masterCvRelationView({
    name: 'CV person’s job assignments',
    relation: 'jobAssignments',
    object: 'jobPersonLink',
    personScoped: true,
    fields: [
      ['name', 200],
      ['jobPosition', 240],
      ['sourcePosting', 240],
    ],
  }),
);
