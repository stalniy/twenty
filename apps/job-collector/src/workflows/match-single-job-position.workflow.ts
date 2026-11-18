import { defineWorkflow } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { profileMatchingSteps } from './profile-matching-steps';

const matching = profileMatchingSteps(IDENTIFIERS.SINGLE_MATCH_WORKFLOW, {
  logicFunctionUniversalIdentifier:
    IDENTIFIERS.PREPARE_SELECTED_MATCHES_FUNCTION,
  input: {
    personId: '{{trigger.payload.personId}}',
    positionId: '{{trigger.payload.id}}',
    force: true,
  },
});

export const matchSingleJobPositionWorkflow = defineWorkflow({
  universalIdentifier: IDENTIFIERS.SINGLE_MATCH_WORKFLOW,
  name: 'Match this job to my CV',
  version: {
    trigger: {
      type: 'MANUAL',
      nextStepIds: [matching.firstStepId],
    },
    steps: matching.steps,
  },
});
