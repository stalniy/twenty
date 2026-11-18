import { defineField, FieldType } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';
import { PROFILE_ELIGIBILITY_OPTIONS } from '../constants/profile-eligibility-options';

export const profileFitEligibilityField = defineField({
  universalIdentifier: IDENTIFIERS.POSITION_FIT_ELIGIBILITY,
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'profileFitEligibility',
  label: 'Location eligibility',
  type: FieldType.SELECT,
  options: PROFILE_ELIGIBILITY_OPTIONS,
});
