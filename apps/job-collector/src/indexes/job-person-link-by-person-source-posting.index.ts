import { defineIndex } from 'twenty-sdk/define';

import { CV_OBJECTS, cvFieldId, cvMetadataId } from '../constants/cv-metadata';

export const jobPersonLinkByPersonSourcePosting = defineIndex({
  universalIdentifier: cvMetadataId(
    'jobPersonLink.index.person-source-posting',
  ),
  objectUniversalIdentifier: CV_OBJECTS.jobPersonLink,
  isUnique: true,
  fields: ['person', 'sourcePosting'].map((field) => ({
    universalIdentifier: cvMetadataId(
      `jobPersonLink.index.person-source-posting.${field}`,
    ),
    fieldUniversalIdentifier: cvFieldId('jobPersonLink', field),
  })),
});
