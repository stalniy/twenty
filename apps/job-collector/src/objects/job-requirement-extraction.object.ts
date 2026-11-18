import { defineObject, FieldType } from 'twenty-sdk/define';
import { cvObject } from '../constants/cv-metadata';

export const jobRequirementExtraction = defineObject(
  cvObject(
    'jobRequirementExtraction',
    'jobRequirementExtractions',
    'Posting extraction',
    'Posting extractions',
    'IconListCheck',
    {
      requirementsJson: {
        label: 'Extracted requirements',
        type: FieldType.TEXT,
      },
    },
  ),
);
