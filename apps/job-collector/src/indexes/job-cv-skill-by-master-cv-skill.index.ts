import { defineIndex } from 'twenty-sdk/define';

import { CV_OBJECTS, cvFieldId, cvMetadataId } from '../constants/cv-metadata';

export const jobCvSkillByMasterCvSkill = defineIndex({
  universalIdentifier: cvMetadataId('jobCvSkill.index.master-cv-skill'),
  objectUniversalIdentifier: CV_OBJECTS.jobCvSkill,
  isUnique: true,
  fields: ['masterCv', 'skill'].map((field) => ({
    universalIdentifier: cvMetadataId(
      `jobCvSkill.index.master-cv-skill.${field}`,
    ),
    fieldUniversalIdentifier: cvFieldId('jobCvSkill', field),
  })),
});
