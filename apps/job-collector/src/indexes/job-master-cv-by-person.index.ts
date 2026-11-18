import { defineIndex } from 'twenty-sdk/define';

import { CV_OBJECTS, cvFieldId, cvMetadataId } from '../constants/cv-metadata';

export const jobMasterCvByPerson = defineIndex({
  universalIdentifier: cvMetadataId('jobMasterCv.index.person'),
  objectUniversalIdentifier: CV_OBJECTS.jobMasterCv,
  isUnique: true,
  fields: ['person'].map((field) => ({
    universalIdentifier: cvMetadataId(`jobMasterCv.index.person.${field}`),
    fieldUniversalIdentifier: cvFieldId('jobMasterCv', field),
  })),
});
