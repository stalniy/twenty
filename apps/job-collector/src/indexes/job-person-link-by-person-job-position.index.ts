import { defineIndex } from 'twenty-sdk/define';

import { CV_OBJECTS, cvFieldId, cvMetadataId } from '../constants/cv-metadata';

export const jobPersonLinkByPersonJobPosition = defineIndex({
  universalIdentifier: cvMetadataId('jobPersonLink.index.person-job-position'),
  objectUniversalIdentifier: CV_OBJECTS.jobPersonLink,
  isUnique: true,
  fields: ['person', 'jobPosition'].map((field) => ({
    universalIdentifier: cvMetadataId(
      `jobPersonLink.index.person-job-position.${field}`,
    ),
    fieldUniversalIdentifier: cvFieldId('jobPersonLink', field),
  })),
});
