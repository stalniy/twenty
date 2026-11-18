import { defineIndex } from 'twenty-sdk/define';

import { CV_OBJECTS, cvFieldId, cvMetadataId } from '../constants/cv-metadata';

export const jobPersonAssessmentByPersonLegacyPosition = defineIndex({
  universalIdentifier: cvMetadataId(
    'jobPersonAssessment.index.person-legacy-position',
  ),
  objectUniversalIdentifier: CV_OBJECTS.jobPersonAssessment,
  isUnique: true,
  fields: ['person', 'legacyPosition'].map((field) => ({
    universalIdentifier: cvMetadataId(
      `jobPersonAssessment.index.person-legacy-position.${field}`,
    ),
    fieldUniversalIdentifier: cvFieldId('jobPersonAssessment', field),
  })),
});
