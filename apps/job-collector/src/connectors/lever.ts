import { postingHtmlToText } from '../utils/posting-html-to-text.util';
import { z } from 'zod';

import { type JobBoard } from '../types/job-board';
import { type NormalizedJob } from '../types/normalized-job';
import { parseBoardSlug } from '../utils/parse-board-slug.util';
import { fetchJson } from './fetch-json';

const postingsSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    hostedUrl: z.url(),
    applyUrl: z.url(),
    workplaceType: z.string().nullish(),
    categories: z.object({ location: z.string().nullish() }).nullish(),
    descriptionPlain: z.string().nullish(),
    description: z.string().nullish(),
    additionalPlain: z.string().nullish(),
    salaryDescriptionPlain: z.string().nullish(),
    lists: z
      .array(z.object({ text: z.string(), content: z.string() }))
      .optional(),
    salaryRange: z
      .object({
        currency: z.string(),
        interval: z.string(),
        min: z.number().finite().nonnegative().nullish(),
        max: z.number().finite().nonnegative().nullish(),
      })
      .nullish(),
  }),
);

export const fetchLeverJobs = async (
  board: JobBoard,
  request: typeof fetch = fetch,
): Promise<NormalizedJob[]> => {
  const slug = parseBoardSlug(board);
  const hostname = board.region === 'EU' ? 'api.eu.lever.co' : 'api.lever.co';
  const jobs: NormalizedJob[] = [];
  const pageSize = 100;

  for (let skip = 0; ; skip += pageSize) {
    const page = postingsSchema.parse(
      await fetchJson(
        `https://${hostname}/v0/postings/${slug}?mode=json&skip=${skip}&limit=${pageSize}`,
        request,
      ),
    );
    for (const posting of page) {
      const sourceUrl = new URL(posting.hostedUrl);
      if (
        sourceUrl.protocol !== 'https:' ||
        !['jobs.lever.co', 'jobs.eu.lever.co'].includes(sourceUrl.hostname)
      ) {
        throw new Error('Invalid Lever posting URL');
      }
      const salary = posting.salaryRange;
      jobs.push({
        provider: 'LEVER',
        externalId: posting.id,
        title: posting.text,
        description: [
          posting.descriptionPlain ??
            postingHtmlToText(posting.description ?? ''),
          ...(posting.lists ?? []).map(
            (list) => `${list.text}\n${postingHtmlToText(list.content)}`,
          ),
          posting.additionalPlain ?? '',
        ]
          .filter(Boolean)
          .join('\n'),
        sourceUrl: posting.hostedUrl,
        applyUrl: posting.applyUrl,
        location: posting.categories?.location ?? '',
        workplaceType:
          posting.workplaceType === 'remote'
            ? 'REMOTE'
            : posting.workplaceType === 'hybrid'
              ? 'HYBRID'
              : posting.workplaceType === 'on-site'
                ? 'ON_SITE'
                : 'UNKNOWN',
        publishedAt: null,
        salaryText:
          posting.salaryDescriptionPlain ||
          (salary
            ? `${salary.currency} ${salary.min ?? '?'}–${salary.max ?? '?'} / ${salary.interval}`
            : ''),
        salaryRanges: salary
          ? [
              {
                currency: salary.currency,
                interval: ['per-year', 'year'].includes(salary.interval)
                  ? 'YEAR'
                  : salary.interval,
                minimum: salary.min ?? null,
                maximum: salary.max ?? null,
              },
            ]
          : [],
      });
    }
    if (page.length < pageSize) {
      break;
    }
  }
  return jobs;
};
