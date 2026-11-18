import { defineWorkflow } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
export const dailyCollectionWorkflow = defineWorkflow({
  universalIdentifier: IDENTIFIERS.DAILY_WORKFLOW,
  name: 'Job Collector · Daily collection',
  version: {
    trigger: {
      type: 'CRON',
      name: 'Every day at 07:00 UTC',
      settings: { type: 'CUSTOM', pattern: '0 7 * * *' },
      nextStepIds: [IDENTIFIERS.DAILY_STEP],
    },
    steps: [
      {
        universalIdentifier: IDENTIFIERS.DAILY_STEP,
        name: 'Collect matching jobs',
        type: 'LOGIC_FUNCTION',
        logicFunctionUniversalIdentifier: IDENTIFIERS.COLLECT_FUNCTION,
        input: {},
        nextStepIds: [],
      },
    ],
  },
});
