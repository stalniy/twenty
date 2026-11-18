import { defineIndex } from 'twenty-sdk/define';

import { CV_OBJECTS, cvFieldId, cvMetadataId } from '../constants/cv-metadata';

export const jobEvidenceSkillByEvidenceSkill = defineIndex({
  universalIdentifier: cvMetadataId('jobEvidenceSkill.index.evidence-skill'),
  objectUniversalIdentifier: CV_OBJECTS.jobEvidenceSkill,
  isUnique: true,
  fields: ['evidence', 'skill'].map((field) => ({
    universalIdentifier: cvMetadataId(
      `jobEvidenceSkill.index.evidence-skill.${field}`,
    ),
    fieldUniversalIdentifier: cvFieldId('jobEvidenceSkill', field),
  })),
});
