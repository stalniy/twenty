import { defineField, FieldType } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';

export const profileMatchReportField = defineField({
  universalIdentifier: IDENTIFIERS.POSITION_MATCH_REPORT,
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'profileMatchReport',
  label: 'Resume matching report',
  type: FieldType.TEXT,
});
