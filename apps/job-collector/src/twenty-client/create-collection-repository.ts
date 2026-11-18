import { createJobRequirementsRepository } from './job-requirements-repository';
import { RestApiClient, RestApiClientError } from 'twenty-client-sdk/rest';
import { isString } from '@sniptt/guards';
import { z } from 'zod';

import { type CollectionRepository } from '../types/collection-repository';
import { type JobBoard } from '../types/job-board';
import { type JobPosition } from '../types/job-position';
import { type SourcePosting } from '../types/source-posting';
import { stableRecordId } from '../utils/stable-record-id.util';
import { matchingPostingSchema } from '../services/profile-matching.service';
import { type Graphql, listRecords } from './record-api';
import { createMasterCvRepository } from './master-cv-repository';
import { createPersonJobRepository } from './person-job-repository';

const boardSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  provider: z.enum([
    'ASHBY',
    'LEVER',
    'WORK_AT_A_STARTUP',
    'ELASTIC',
    'FYUL',
    'THE_AA',
  ]),
  slug: z.string(),
  region: z.enum(['GLOBAL', 'EU']),
  companyId: z.uuid(),
});

export const createCollectionRepository = (
  client = new RestApiClient({
    runAs: 'application',
    baseUrl:
      process.env.COLLECTOR_API_URL?.trim() ||
      process.env.TWENTY_INTERNAL_API_URL?.trim() ||
      undefined,
  }),
) => {
  const graphql: Graphql = async <TData>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<TData> => {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const result = await client.post<{
          data?: TData;
          errors?: { message: string }[];
        }>(
          '/graphql',
          { query, variables },
          { signal: AbortSignal.timeout(30000) },
        );
        if (result.errors?.length) {
          if (
            result.errors.some((error) =>
              /rate limit exceeded/i.test(error.message),
            ) &&
            attempt < 5
          ) {
            await new Promise((resolve) => setTimeout(resolve, 20000));
            continue;
          }
          throw new Error(
            result.errors.map((error) => error.message).join('; '),
          );
        }
        if (result.data === undefined)
          throw new Error('Twenty returned no data');
        return result.data;
      } catch (error) {
        if (
          error instanceof RestApiClientError &&
          error.status === 429 &&
          attempt < 5
        ) {
          await new Promise((resolve) => setTimeout(resolve, 20000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Twenty rate limit persisted after retries');
  };

  const list = <TRecord>(
    collection: string,
    selection: string,
    filter?: string,
  ) => listRecords<TRecord>(graphql, collection, selection, filter);

  const repository: CollectionRepository = {
    listBoards: async () =>
      (
        await list<unknown>(
          'jobCollectorBoards',
          'id name provider slug region companyId',
          ',filter:{enabled:{eq:true}}',
        )
      ).map((board) => boardSchema.parse(board)),
    listPositions: () =>
      list<JobPosition>(
        'jobpositions',
        'id companyId location joburl{primaryLinkUrl}',
      ),
    listPostings: () =>
      list<SourcePosting>(
        'jobSourcePostings',
        'id provider externalId jobPositionId',
      ),
    createPosition: async (board, job, salary, id) => {
      const data = await graphql<{ createJobposition: JobPosition }>(
        'mutation Create($data:JobpositionCreateInput!){createJobposition(data:$data){id companyId location joburl{primaryLinkUrl}}}',
        {
          data: {
            id,
            name: job.title,
            status: 'NEW',
            companyId: board.companyId,
            location: job.location || null,
            joburl: {
              primaryLinkUrl: job.sourceUrl,
              primaryLinkLabel: job.provider,
            },
            salary: job.salaryText,
            ...salary,
            mentionsTypeScript: /\btypescript\b/i.test(
              `${job.title} ${job.description}`,
            ),
            matchReason: `${job.provider}: fully remote; matching title and keyword. Location: ${job.location}.`,
          },
        },
      );
      return data.createJobposition;
    },
    updatePositionLocation: async (positionId, location) => {
      await graphql(
        'mutation Location($id:UUID!,$data:JobpositionUpdateInput!){updateJobposition(id:$id,data:$data){id}}',
        { id: positionId, data: { location } },
      );
    },
    savePosting: async (board, job, salary, positionId, seenAt) => {
      await graphql(
        'mutation Save($data:JobSourcePostingCreateInput!){createJobSourcePosting(data:$data,upsert:true){id}}',
        {
          data: {
            id: stableRecordId(
              `source-posting:${job.provider}:${job.externalId}`,
            ),
            name: job.title,
            provider: job.provider,
            externalId: job.externalId,
            companyId: board.companyId,
            sourceUrl: { primaryLinkUrl: job.sourceUrl },
            applyUrl: { primaryLinkUrl: job.applyUrl },
            description: job.description,
            location: job.location,
            workplaceType: job.workplaceType,
            publishedAt: job.publishedAt,
            lastSeenAt: seenAt,
            jobPositionId: positionId,
            ...salary,
            salaryText: job.salaryText,
          },
        },
      );
    },
    saveBoardResult: async (boardId, result) => {
      await graphql(
        'mutation Result($id:UUID!,$data:JobCollectorBoardUpdateInput!){updateJobCollectorBoard(id:$id,data:$data){id}}',
        {
          id: boardId,
          data: {
            lastRunAt: result.seenAt,
            lastRunStatus: result.error === null ? 'SUCCESS' : 'ERROR',
            lastError: result.error,
            matchCount: result.matched,
          },
        },
      );
    },
  };

  const seedBoards = async (legacySlugField: string) => {
    const companyRecords = await list<{
      id: string;
      name: string;
      [fieldName: string]: unknown;
    }>('companies', `id name ${legacySlugField}`);
    const companies = companyRecords.map((company) => ({
      id: company.id,
      name: company.name,
      slug: isString(company[legacySlugField])
        ? company[legacySlugField]
        : null,
    }));
    const existing = await list<JobBoard>(
      'jobCollectorBoards',
      'id name provider slug region companyId',
    );
    const keys = new Set(
      existing.map(
        (board) => `${board.companyId}:${board.provider}:${board.slug}`,
      ),
    );
    const pending = companies.filter(
      (company) =>
        company.slug?.trim() &&
        !keys.has(`${company.id}:ASHBY:${company.slug.trim()}`),
    );
    for (let offset = 0; offset < pending.length; offset += 50) {
      await graphql(
        'mutation Seed($data:[JobCollectorBoardCreateInput!]!){createJobCollectorBoards(data:$data,upsert:true){id}}',
        {
          data: pending.slice(offset, offset + 50).map((company) => ({
            id: stableRecordId(
              `board:${company.id}:ASHBY:${company.slug?.trim()}`,
            ),
            name: `${company.name} · Ashby`,
            provider: 'ASHBY',
            slug: company.slug?.trim(),
            region: 'GLOBAL',
            companyId: company.id,
            enabled: true,
          })),
        },
      );
    }
    return { created: pending.length };
  };

  const personJobs = createPersonJobRepository(graphql);
  const listMatchingPostings = async (
    personId: string,
    positionIds?: string[],
  ) => {
    const assessments = await personJobs.listAssessments(personId);
    const fingerprints = new Map(
      assessments.map(({ sourcePostingId, matchFingerprint }) => [
        sourcePostingId,
        matchFingerprint,
      ]),
    );
    const postings = [];
    const selection =
      'id name description location workplaceType salaryText jobPositionId';
    if (positionIds === undefined) {
      postings.push(...(await list<unknown>('jobSourcePostings', selection)));
    } else {
      const ids = z.array(z.uuid()).parse(positionIds);
      for (let offset = 0; offset < ids.length; offset += 100) {
        postings.push(
          ...(await list<unknown>(
            'jobSourcePostings',
            selection,
            `,filter:{jobPositionId:{in:${JSON.stringify(ids.slice(offset, offset + 100))}}}`,
          )),
        );
      }
    }
    return postings.map((record) => {
      const posting = matchingPostingSchema.parse(record);
      return {
        ...posting,
        matchFingerprint: fingerprints.get(posting.id) ?? null,
      };
    });
  };

  return {
    repository,
    seedBoards,
    listMatchingPostings,
    ...personJobs,
    ...createJobRequirementsRepository(graphql),
    ...createMasterCvRepository(graphql),
  };
};
