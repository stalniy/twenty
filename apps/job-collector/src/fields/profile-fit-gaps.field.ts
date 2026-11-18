import { defineField, FieldType } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';

export const profileFitGapsField = defineField({
  universalIdentifier: IDENTIFIERS.POSITION_FIT_GAPS,
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'profileFitGaps',
  label: 'Profile gaps and unknowns',
  type: FieldType.TEXT,
});
