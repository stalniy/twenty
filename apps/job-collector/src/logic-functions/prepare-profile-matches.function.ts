import { defineLogicFunction } from 'twenty-sdk/define';
import { z } from 'zod';

import { IDENTIFIERS } from '../constants/identifiers';
import {
  matchingBatchSize,
  prepareProfileMatches,
} from '../services/profile-matching.service';
import { createCollectionRepository } from '../twenty-client/create-collection-repository';

export const prepareProfileMatchesFunction = defineLogicFunction({
  universalIdentifier: IDENTIFIERS.PREPARE_MATCHES_FUNCTION,
  name: 'prepare-profile-matches',
  description: 'Select new or changed source postings for CV matching.',
  timeoutSeconds: 120,
  handler: async (input: { personId?: string } = {}) => {
    const repository = createCollectionRepository();
    const person = await repository.resolvePerson(
      z.uuid().optional().parse(input.personId),
    );
    const profile = await repository.readMatchingProfile(person.id);
    const postings = await repository.listMatchingPostings(person.id);
    const result = prepareProfileMatches(
      postings,
      profile.text,
      matchingBatchSize(),
      profile.records,
    );
    const candidates = new Set(
      result.candidates.map(({ postingId }) => postingId),
    );
    const selected = postings.filter(({ id }) => candidates.has(id));
    await repository.linkJobs(
      person.id,
      selected.map(({ id }) => id),
      [
        ...new Set(
          selected.flatMap(({ jobPositionId }) =>
            jobPositionId ? [jobPositionId] : [],
          ),
        ),
      ],
    );
    return {
      ...result,
      candidates: await repository.markCachedExtractions(result.candidates),
      personId: person.id,
      cvRecordsJson: JSON.stringify(profile.records),
    };
  },
  workflowActionTriggerSettings: {},
});
