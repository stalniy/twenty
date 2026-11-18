import { defineCommandMenuItem } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';

export const matchJobPositions = defineCommandMenuItem({
  universalIdentifier: IDENTIFIERS.RECORD_MATCHING_COMMAND,
  label: 'Match to a CV',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  availabilityObjectUniversalIdentifier:
    JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  frontComponentUniversalIdentifier: IDENTIFIERS.RECORD_MATCHING_COMPONENT,
});
