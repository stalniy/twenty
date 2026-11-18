import { isString } from '@sniptt/guards';

import { type CollectionRepository } from '../types/collection-repository';
import { type JobFilters } from '../types/job-filters';
import { type JobBoard } from '../types/job-board';
import { type NormalizedJob } from '../types/normalized-job';
import { canonicalJobUrl } from '../utils/canonical-job-url.util';
import { matchesJob } from '../utils/matches-job.util';
import { normalizeJobLocation } from '../utils/normalize-job-location.util';
import { salaryFields } from '../utils/salary-fields.util';
import { stableRecordId } from '../utils/stable-record-id.util';

type CollectionOptions = {
  repository: CollectionRepository;
  connectors: Record<
    JobBoard['provider'],
    (board: JobBoard) => Promise<NormalizedJob[]>
  >;
  filters: JobFilters;
  now?: () => Date;
};

export const collectJobs = async ({
  repository,
  connectors,
  filters,
  now = () => new Date(),
}: CollectionOptions) => {
  const boards = await repository.listBoards();
  const positions = await repository.listPositions();
  const postings = await repository.listPostings();
  const positionsById = new Map(
    positions.map((position) => [position.id, position]),
  );
  const positionsByUrl = new Map<string, string>();
  for (const position of positions) {
    if (position.companyId && position.joburl?.primaryLinkUrl) {
      try {
        positionsByUrl.set(
          `${position.companyId}:${canonicalJobUrl(position.joburl.primaryLinkUrl)}`,
          position.id,
        );
      } catch {
        continue;
      }
    }
  }
  const positionIdsByPosting = new Map(
    postings
      .filter(
        (posting) =>
          isString(posting.jobPositionId) &&
          positionsById.has(posting.jobPositionId),
      )
      .map((posting) => [
        `${posting.provider}:${posting.externalId}`,
        posting.jobPositionId,
      ]),
  );
  const summary = {
    boards: boards.length,
    succeeded: 0,
    matched: 0,
    created: 0,
    linkedExisting: 0,
    errors: [] as { boardId: string; message: string }[],
  };
  const seenAt = now().toISOString();

  for (const board of boards) {
    let matched = 0;
    let boardError: string | null = null;
    try {
      const jobs = await connectors[board.provider](board);
      for (const job of jobs) {
        if (!matchesJob(job, filters)) continue;
        matched++;
        summary.matched++;
        const sourceKey = `${job.provider}:${job.externalId}`;
        const urls = [job.sourceUrl, job.applyUrl].map(
          (url) => `${board.companyId}:${canonicalJobUrl(url)}`,
        );
        let positionId =
          positionIdsByPosting.get(sourceKey) ??
          urls.map((url) => positionsByUrl.get(url)).find(isString);
        const salary = salaryFields(job);
        const location = normalizeJobLocation(job.location);
        if (!isString(positionId)) {
          const position = await repository.createPosition(
            board,
            { ...job, location },
            salary,
            stableRecordId(`job-position:${urls[1]}`),
          );
          positionId = position.id;
          positionsById.set(position.id, position);
          summary.created++;
        } else {
          summary.linkedExisting++;
          const position = positionsById.get(positionId);
          if (location && position?.location !== location) {
            await repository.updatePositionLocation(positionId, location);
            if (position) position.location = location;
          }
        }
        await repository.savePosting(board, job, salary, positionId, seenAt);
        positionIdsByPosting.set(sourceKey, positionId);
        for (const url of urls) positionsByUrl.set(url, positionId);
      }
      summary.succeeded++;
    } catch (error) {
      boardError = error instanceof Error ? error.message : String(error);
      summary.errors.push({ boardId: board.id, message: boardError });
    }
    try {
      await repository.saveBoardResult(board.id, {
        seenAt,
        matched,
        error: boardError,
      });
    } catch (error) {
      summary.errors.push({
        boardId: board.id,
        message: `Could not save board result: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
  if (boards.length > 0 && summary.succeeded === 0) {
    throw new Error(`All job boards failed: ${JSON.stringify(summary.errors)}`);
  }
  return summary;
};
