import { defineView } from 'twenty-sdk/define';

import { masterCvRelationView } from '../constants/master-cv-relation-view';

export const masterCvSkillsView = defineView(
  masterCvRelationView({
    name: 'CV skills',
    relation: 'cvSkills',
    object: 'jobCvSkill',
    fields: [
      ['name', 220],
      ['skill', 220],
      ['skillGroup', 200],
    ],
  }),
);
