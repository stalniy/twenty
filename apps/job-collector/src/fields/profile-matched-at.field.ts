import { defineField, FieldType } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';

export const profileMatchedAtField = defineField({
  universalIdentifier: IDENTIFIERS.POSITION_MATCHED_AT,
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'profileMatchedAt',
  label: 'Profile assessed at',
  type: FieldType.DATE_TIME,
});
