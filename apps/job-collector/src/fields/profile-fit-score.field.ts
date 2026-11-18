import { defineField, FieldType } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';

export const profileFitScoreField = defineField({
  universalIdentifier: IDENTIFIERS.POSITION_FIT_SCORE,
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'profileFitScore',
  label: 'Requirement coverage (%)',
  type: FieldType.NUMBER,
});
