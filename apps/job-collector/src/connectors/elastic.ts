import { postingHtmlToText } from '../utils/posting-html-to-text.util';
import { load } from 'cheerio/slim';
import { isNumber } from '@sniptt/guards';
import { z } from 'zod';

import { type JobBoard } from '../types/job-board';
import { type NormalizedJob } from '../types/normalized-job';
import { parseBoardSlug } from '../utils/parse-board-slug.util';
import { fetchJson } from './fetch-json';

const REMOTE_LOCATIONS_METADATA_NAME =
  'Target Remote Countries / States Locations [For Job Wrapping]';

const jobSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  absolute_url: z.url(),
  location: z.object({ name: z.string().nullish() }),
  content: z.string().nullish(),
  first_published: z.iso.datetime({ offset: true }).nullish(),
  metadata: z
    .array(z.object({ name: z.string(), value: z.unknown() }))
    .nullish(),
});
const feedSchema = z.object({
  jobs: z.array(jobSchema),
  meta: z.object({ total: z.number().int().nonnegative() }).optional(),
});
const detailSchema = z.object({
  id: z.number().int().positive(),
  pay_input_ranges: z
    .array(
      z.object({
        min_cents: z.number().int().nonnegative().nullish(),
        max_cents: z.number().int().nonnegative().nullish(),
        currency_type: z.string(),
        title: z.string().nullish(),
        blurb: z.string().nullish(),
      }),
    )
    .nullish(),
});

export const fetchElasticJobs = async (
  board: JobBoard,
  request: typeof fetch = fetch,
): Promise<NormalizedJob[]> => {
  parseBoardSlug(board);
  const feed = feedSchema.parse(
    await fetchJson(
      'https://boards-api.greenhouse.io/v1/boards/elastic/jobs?content=true',
      request,
    ),
  );
  if (feed.meta && feed.meta.total !== feed.jobs.length) {
    throw new Error('Elastic returned an incomplete job feed');
  }
  const remoteJobs = feed.jobs.filter((job) => {
    if (/\b(hybrid|on[- ]?site|in[- ]office)\b/i.test(job.location.name ?? ''))
      return false;
    return (job.metadata ?? []).some(
      (field) =>
        field.name === REMOTE_LOCATIONS_METADATA_NAME &&
        z.array(z.string().trim().min(1)).min(1).safeParse(field.value).success,
    );
  });
  const jobs: NormalizedJob[] = new Array(remoteJobs.length);
  let nextIndex = 0;
  let failure: Error | undefined;
  await Promise.all(
    Array.from({ length: Math.min(2, remoteJobs.length) }, async () => {
      while (!failure && nextIndex < remoteJobs.length) {
        const index = nextIndex++;
        try {
          const job = remoteJobs[index];
          const url = new URL(job.absolute_url);
          if (
            url.protocol !== 'https:' ||
            url.hostname !== 'jobs.elastic.co' ||
            url.pathname !== '/jobs' ||
            !url.searchParams
              .getAll('gh_jid')
              .every((identifier) => identifier === String(job.id)) ||
            !url.searchParams.has('gh_jid')
          ) {
            throw new Error('Invalid Elastic job URL');
          }
          const decodedContent = load(job.content ?? '').text();
          const description = postingHtmlToText(decodedContent);
          if (!description)
            throw new Error(`Elastic job ${job.id} has no description`);
          const detail = detailSchema.parse(
            await fetchJson(
              `https://boards-api.greenhouse.io/v1/boards/elastic/jobs/${job.id}?pay_transparency=true`,
              request,
            ),
          );
          if (detail.id !== job.id)
            throw new Error('Elastic pay details belong to a different job');
          const ranges = detail.pay_input_ranges ?? [];
          jobs[index] = {
            provider: 'ELASTIC',
            externalId: String(job.id),
            title: job.title,
            description,
            sourceUrl: url.href,
            applyUrl: url.href,
            location: job.location.name ?? '',
            workplaceType: 'REMOTE',
            publishedAt: job.first_published ?? null,
            salaryText: ranges
              .map(
                (range) =>
                  `${range.currency_type} ${isNumber(range.min_cents) ? range.min_cents / 100 : '?'}–${isNumber(range.max_cents) ? range.max_cents / 100 : '?'}`,
              )
              .join('; '),
            salaryRanges: ranges.map((range) => ({
              currency: range.currency_type,
              interval:
                /\b(?:annual|yearly)(?:\s+base)?\s+(?:pay|salary|compensation)\b|\b(?:pay|salary|compensation)(?:\s+range)?[^.!?]{0,30}\b(?:per year|annually)\b/i.test(
                  load(`${range.title ?? ''} ${range.blurb ?? ''}`).text(),
                )
                  ? 'YEAR'
                  : 'UNSPECIFIED',
              minimum: isNumber(range.min_cents) ? range.min_cents / 100 : null,
              maximum: isNumber(range.max_cents) ? range.max_cents / 100 : null,
            })),
          };
        } catch (error) {
          failure ??= error instanceof Error ? error : new Error(String(error));
        }
      }
    }),
  );
  if (failure) throw failure;
  return jobs;
};
