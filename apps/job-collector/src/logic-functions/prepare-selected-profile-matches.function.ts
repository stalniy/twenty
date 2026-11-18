import { defineLogicFunction } from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { matchingBatchSize } from '../services/profile-matching.service';
import {
  selectedMatchingInputSchema,
  prepareSelectedProfileMatches,
} from '../services/prepare-selected-profile-matches.service';
import { createCollectionRepository } from '../twenty-client/create-collection-repository';

export const prepareSelectedProfileMatchesFunction = defineLogicFunction({
  universalIdentifier: IDENTIFIERS.PREPARE_SELECTED_MATCHES_FUNCTION,
  name: 'prepare-selected-profile-matches',
  description: 'Prepare CV matching only for the selected Job Positions.',
  timeoutSeconds: 120,
  handler: async (input: {
    personId?: string;
    positionId?: string;
    positions?: { id: string }[];
    force?: boolean;
  }) => {
    const selection = selectedMatchingInputSchema.parse(input);
    const positionIds = [
      ...new Set(
        selection.positionId
          ? [selection.positionId]
          : (selection.positions?.map((position) => position.id) ?? []),
      ),
    ];
    const repository = createCollectionRepository();
    const person = await repository.resolvePerson(selection.personId);
    const profile = await repository.readMatchingProfile(person.id);
    const postings = await repository.listMatchingPostings(
      person.id,
      positionIds,
    );
    const result = prepareSelectedProfileMatches(
      postings,
      positionIds,
      profile.text,
      matchingBatchSize(),
      selection.force,
      profile.records,
    );
    if (
      selection.positionId &&
      result.positionsWithoutDescriptions.length > 0
    ) {
      throw new Error(
        'This Job Position has no linked Source posting with a description to assess.',
      );
    }
    await repository.linkJobs(
      person.id,
      postings.map(({ id }) => id),
      positionIds,
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
