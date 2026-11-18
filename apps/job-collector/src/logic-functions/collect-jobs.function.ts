import { defineLogicFunction } from 'twenty-sdk/define';
import { z } from 'zod';

import { IDENTIFIERS } from '../constants/identifiers';
import { fetchTheAaJobs } from '../connectors/the-aa';
import { fetchAshbyJobs } from '../connectors/ashby';
import { fetchElasticJobs } from '../connectors/elastic';
import { fetchFyulJobs } from '../connectors/fyul';
import { fetchLeverJobs } from '../connectors/lever';
import { fetchWorkAtStartupJobs } from '../connectors/work-at-startup';
import { collectJobs } from '../services/collect-jobs.service';
import { createCollectionRepository } from '../twenty-client/create-collection-repository';
import { collectionSettings } from '../utils/collection-settings.util';

export const runJobCollection = async (input: { personId?: string } = {}) => {
  const { repository, seedBoards, resolvePerson, readTargetRole } =
    createCollectionRepository();
  const person = await resolvePerson(
    z
      .uuid()
      .optional()
      .parse(input.personId || undefined),
  );
  const targetRole = await readTargetRole(person.id);
  const settings = collectionSettings();
  await seedBoards(settings.legacySlugField);
  const summary = await collectJobs({
    repository,
    connectors: {
      ASHBY: fetchAshbyJobs,
      LEVER: fetchLeverJobs,
      WORK_AT_A_STARTUP: fetchWorkAtStartupJobs,
      ELASTIC: fetchElasticJobs,
      FYUL: fetchFyulJobs,
      THE_AA: fetchTheAaJobs,
    },
    filters: { ...settings, targetRole },
  });
  console.log(JSON.stringify(summary));
  return summary;
};

export const collectJobsFunction = defineLogicFunction({
  universalIdentifier: IDENTIFIERS.COLLECT_FUNCTION,
  name: 'collect-jobs',
  description: 'Collect matching jobs from enabled company boards.',
  timeoutSeconds: 900,
  handler: (input: { personId?: string } = {}) => runJobCollection(input),
  workflowActionTriggerSettings: {},
  httpRouteTriggerSettings: {
    path: '/job-collector/collect',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
