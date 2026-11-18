import { defineWorkflow } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { profileMatchingSteps } from './profile-matching-steps';

const matching = profileMatchingSteps(IDENTIFIERS.BULK_MATCH_WORKFLOW, {
  logicFunctionUniversalIdentifier:
    IDENTIFIERS.PREPARE_SELECTED_MATCHES_FUNCTION,
  input: {
    personId: '{{trigger.payload.personId}}',
    positions: '{{trigger.payload.jobpositions}}',
  },
});

export const matchSelectedJobPositionsWorkflow = defineWorkflow({
  universalIdentifier: IDENTIFIERS.BULK_MATCH_WORKFLOW,
  name: 'Match selected jobs to my CV',
  version: {
    trigger: {
      type: 'MANUAL',
      nextStepIds: [matching.firstStepId],
    },
    steps: matching.steps,
  },
});
