import { defineLogicFunction } from 'twenty-sdk/define';
import { z } from 'zod';

import { IDENTIFIERS } from '../constants/identifiers';
import { createCollectionRepository } from '../twenty-client/create-collection-repository';

export const importMasterCvAndBackfillJobsFunction = defineLogicFunction({
  universalIdentifier: IDENTIFIERS.SYNC_POSITION_MATCHES_FUNCTION,
  name: 'import-master-cv-and-backfill-jobs',
  description:
    'Import the installed résumé and attribute legacy jobs to the workspace owner’s CRM Person.',
  timeoutSeconds: 900,
  handler: async (input: { personId?: string } = {}) => {
    const repository = createCollectionRepository();
    const person = await repository.resolvePerson(
      z.uuid().optional().parse(input.personId),
    );
    const cv = await repository.importResume(person.id);
    const jobs = await repository.backfillJobs(person.id);
    return { ...cv, ...jobs };
  },
});
