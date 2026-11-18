import { defineLogicFunction } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { createCollectionRepository } from '../twenty-client/create-collection-repository';

export const saveProfileMatchFunction = defineLogicFunction({
  universalIdentifier: IDENTIFIERS.SAVE_MATCH_FUNCTION,
  name: 'save-profile-match',
  description:
    'Validate and save an AI profile assessment for the assigned Person and Source posting.',
  timeoutSeconds: 120,
  handler: async (input: {
    personId: string;
    postingId: string;
    fingerprint: string;
    assessment: string;
    linkedJson: string;
  }) => createCollectionRepository().saveProfileMatch(input),
  workflowActionTriggerSettings: {},
});
