import { postingHtmlToText } from '../utils/posting-html-to-text.util';
import { z } from 'zod';

import { type JobBoard } from '../types/job-board';
import { type NormalizedJob } from '../types/normalized-job';
import { parseBoardSlug } from '../utils/parse-board-slug.util';
import { fetchJson } from './fetch-json';

const API_URL = 'https://api.smartrecruiters.com/v1/companies/TheAA1/postings';
const PAGE_SIZE = 100;
const MAXIMUM_PAGES = 20;
const jobSchema = z.object({
  id: z.string().regex(/^\d+$/),
  name: z.string().trim().min(1),
  company: z.object({ identifier: z.literal('TheAA1') }),
  releasedDate: z.iso.datetime({ offset: true }).nullish(),
  visibility: z.literal('PUBLIC'),
  location: z.object({
    fullLocation: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    remote: z.boolean().optional(),
    hybrid: z.boolean().optional(),
  }),
  customField: z
    .array(
      z.object({
        fieldLabel: z.string(),
        valueLabel: z.string(),
      }),
    )
    .optional(),
});
const feedSchema = z.object({
  offset: z.number().int().nonnegative(),
  limit: z.literal(PAGE_SIZE),
  totalFound: z.number().int().nonnegative(),
  content: z.array(jobSchema),
});
const detailSchema = jobSchema.extend({
  active: z.literal(true),
  postingUrl: z.url(),
  applyUrl: z.url(),
  jobAd: z.object({
    sections: z.record(
      z.string(),
      z.object({ title: z.string(), text: z.string() }),
    ),
  }),
});

const isRemote = (job: z.infer<typeof jobSchema>) =>
  job.location.remote === true &&
  job.location.hybrid !== true &&
  // AA also marks mobile roadside roles as remote; require home-worker metadata.
  job.customField?.some(
    (field) =>
      field.fieldLabel === 'Location' && field.valueLabel === 'HOME WORKER',
  ) === true;

const validatePostingUrl = (value: string, identifier: string): string => {
  const url = new URL(value);
  if (
    url.origin !== 'https://jobs.smartrecruiters.com' ||
    url.username ||
    url.password ||
    url.hash ||
    !url.pathname.startsWith(`/TheAA1/${identifier}-`) ||
    url.pathname.slice('/TheAA1/'.length).includes('/')
  )
    throw new Error('The AA returned an invalid posting URL');
  return url.href;
};

export const fetchTheAaJobs = async (
  board: JobBoard,
  request: typeof fetch = fetch,
): Promise<NormalizedJob[]> => {
  parseBoardSlug(board);
  const postings: z.infer<typeof jobSchema>[] = [];
  const identifiers = new Set<string>();
  let total: number | undefined;
  for (let page = 0; ; page++) {
    if (page >= MAXIMUM_PAGES)
      throw new Error('The AA exceeded the maximum number of pages');
    const offset = page * PAGE_SIZE;
    const feed = feedSchema.parse(
      await fetchJson(
        `${API_URL}?limit=${PAGE_SIZE}&offset=${offset}`,
        request,
      ),
    );
    total ??= feed.totalFound;
    if (
      feed.offset !== offset ||
      feed.totalFound !== total ||
      feed.content.length !== Math.min(PAGE_SIZE, total - offset)
    ) {
      throw new Error('The AA returned an incomplete job feed');
    }
    for (const posting of feed.content) {
      if (identifiers.has(posting.id))
        throw new Error('The AA feed pagination repeated a posting');
      identifiers.add(posting.id);
      if (isRemote(posting)) postings.push(posting);
    }
    if (identifiers.size === total) break;
  }

  const jobs: NormalizedJob[] = [];
  let nextIndex = 0;
  let failure: Error | undefined;
  await Promise.all(
    Array.from({ length: Math.min(2, postings.length) }, async () => {
      while (!failure && nextIndex < postings.length) {
        const posting = postings[nextIndex++];
        try {
          const detail = detailSchema.parse(
            await fetchJson(`${API_URL}/${posting.id}`, request),
          );
          if (detail.id !== posting.id)
            throw new Error('The AA details belong to a different job');
          if (!isRemote(detail)) continue;
          const description = postingHtmlToText(
            Object.values(detail.jobAd.sections)
              .map((section) => section.text)
              .join('\n'),
          );
          if (!description)
            throw new Error(`The AA job ${detail.id} has no description`);
          jobs.push({
            provider: 'THE_AA',
            externalId: detail.id,
            title: detail.name,
            description,
            sourceUrl: validatePostingUrl(detail.postingUrl, detail.id),
            applyUrl: validatePostingUrl(detail.applyUrl, detail.id),
            location:
              detail.location.fullLocation ??
              [
                detail.location.city,
                detail.location.region,
                detail.location.country,
              ]
                .filter(Boolean)
                .join(', '),
            workplaceType: 'REMOTE',
            publishedAt: detail.releasedDate ?? null,
            salaryText: [
              ...(detail.customField ?? [])
                .filter((field) => field.fieldLabel === 'Salary')
                .map((field) => field.valueLabel),
              ...description
                .split('\n')
                .map((line) => line.trim())
                .filter((line) =>
                  /(?:[£$€]\s*\d|\b(?:GBP|USD|EUR)\s*\d)/.test(line),
                ),
            ].join('\n'),
            salaryRanges: [],
          });
        } catch (error) {
          failure ??= error instanceof Error ? error : new Error(String(error));
        }
      }
    }),
  );
  if (failure) throw failure;
  return jobs;
};
