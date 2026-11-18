import { defineField, FieldType } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';

export const profileFitReasonField = defineField({
  universalIdentifier: IDENTIFIERS.POSITION_FIT_REASON,
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'profileFitReason',
  label: 'Profile fit reasons',
  type: FieldType.TEXT,
});
