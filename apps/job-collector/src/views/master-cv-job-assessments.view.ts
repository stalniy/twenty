import { defineView } from 'twenty-sdk/define';

import { masterCvRelationView } from '../constants/master-cv-relation-view';

export const masterCvJobAssessmentsView = defineView(
  masterCvRelationView({
    name: 'CV person’s job assessments',
    relation: 'jobAssessments',
    object: 'jobPersonAssessment',
    personScoped: true,
    fields: [
      ['name', 220],
      ['sourcePosting', 220],
      ['legacyPosition', 220],
      ['fitScore', 100],
      ['profileMatchedAt', 150],
    ],
  }),
);
