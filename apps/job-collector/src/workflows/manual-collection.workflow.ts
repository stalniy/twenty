import { defineWorkflow } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
export const manualCollectionWorkflow = defineWorkflow({
  universalIdentifier: IDENTIFIERS.MANUAL_WORKFLOW,
  name: 'Job Collector · Collect now',
  version: {
    trigger: {
      type: 'MANUAL',
      settings: { availability: { type: 'GLOBAL' } },
      nextStepIds: [IDENTIFIERS.MANUAL_STEP],
    },
    steps: [
      {
        universalIdentifier: IDENTIFIERS.MANUAL_STEP,
        name: 'Collect matching jobs',
        type: 'LOGIC_FUNCTION',
        logicFunctionUniversalIdentifier: IDENTIFIERS.COLLECT_FUNCTION,
        input: { personId: '{{trigger.payload.personId}}' },
        nextStepIds: [],
      },
    ],
  },
});
