import { defineIndex } from 'twenty-sdk/define';

import { CV_OBJECTS, cvFieldId, cvMetadataId } from '../constants/cv-metadata';

export const jobPersonAssessmentByPersonSourcePosting = defineIndex({
  universalIdentifier: cvMetadataId(
    'jobPersonAssessment.index.person-source-posting',
  ),
  objectUniversalIdentifier: CV_OBJECTS.jobPersonAssessment,
  isUnique: true,
  fields: ['person', 'sourcePosting'].map((field) => ({
    universalIdentifier: cvMetadataId(
      `jobPersonAssessment.index.person-source-posting.${field}`,
    ),
    fieldUniversalIdentifier: cvFieldId('jobPersonAssessment', field),
  })),
});
