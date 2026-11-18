import { definePostInstallLogicFunction } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { createCollectionRepository } from '../twenty-client/create-collection-repository';
import { collectionSettings } from '../utils/collection-settings.util';

export const seedBoardsPostInstall = definePostInstallLogicFunction({
  universalIdentifier: IDENTIFIERS.SEED_FUNCTION,
  name: 'seed-job-boards',
  timeoutSeconds: 120,
  shouldRunSynchronously: true,
  handler: async () =>
    createCollectionRepository().seedBoards(
      collectionSettings().legacySlugField,
    ),
});
