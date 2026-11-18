import { defineView } from 'twenty-sdk/define';

import { masterCvRelationView } from '../constants/master-cv-relation-view';

export const masterCvCredentialsView = defineView(
  masterCvRelationView({
    name: 'CV credentials',
    relation: 'credentials',
    object: 'jobCvCredential',
    fields: [
      ['name', 240],
      ['credentialType', 160],
      ['proficiency', 160],
      ['description', 320],
    ],
  }),
);
