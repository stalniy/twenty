import { defineLogicFunction } from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
import { createCollectionRepository } from '../twenty-client/create-collection-repository';

export const matchPostingRequirements = defineLogicFunction({
  universalIdentifier: IDENTIFIERS.MATCH_REQUIREMENTS_FUNCTION,
  name: 'match-posting-requirements',
  description:
    'Link posting requirements to workspace skills and compare them with the selected CV.',
  timeoutSeconds: 300,
  handler: async (input: {
    postingId: string;
    extractionPrompt: string;
    requirements: string;
    cvRecordsJson: string;
  }) => createCollectionRepository().matchRequirements(input),
  workflowActionTriggerSettings: {},
});
