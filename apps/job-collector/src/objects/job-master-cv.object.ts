import { defineObject, FieldType } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobMasterCv = defineObject(
  cvObject(
    'jobMasterCv',
    'jobMasterCvs',
    'Master CV',
    'Master CVs',
    'IconFileCv',
    {
      targetRole: { label: 'Target role', type: FieldType.TEXT },
      summary: { label: 'Summary', type: FieldType.TEXT },
      location: { label: 'Location', type: FieldType.TEXT },
      resumeSource: { label: 'Resume source', type: FieldType.TEXT },
      importStatus: { label: 'Import status', type: FieldType.TEXT },
    },
  ),
);
