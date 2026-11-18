import { postingHtmlToText } from '../utils/posting-html-to-text.util';
import { z } from 'zod';

import { type JobBoard } from '../types/job-board';
import { type NormalizedJob } from '../types/normalized-job';
import { parseBoardSlug } from '../utils/parse-board-slug.util';
import { fetchJson } from './fetch-json';

const componentSchema = z.object({
  compensationType: z.string(),
  currencyCode: z.string().nullish(),
  interval: z.string(),
  minValue: z.number().finite().nonnegative().nullish(),
  maxValue: z.number().finite().nonnegative().nullish(),
});

const boardSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string().nullish(),
      title: z.string(),
      isListed: z.boolean(),
      workplaceType: z.string().nullish(),
      location: z.string().nullish(),
      descriptionPlain: z.string().nullish(),
      descriptionHtml: z.string().nullish(),
      jobUrl: z.url(),
      applyUrl: z.url().nullish(),
      publishedAt: z.iso.datetime({ offset: true }).nullish(),
      compensation: z
        .object({
          scrapeableCompensationSalarySummary: z.string().nullish(),
          compensationTierSummary: z.string().nullish(),
          summaryComponents: z.array(componentSchema).optional(),
          compensationTiers: z
            .array(z.object({ components: z.array(componentSchema) }))
            .optional(),
        })
        .nullish(),
    }),
  ),
});

export const fetchAshbyJobs = async (
  board: JobBoard,
  request: typeof fetch = fetch,
): Promise<NormalizedJob[]> => {
  const slug = parseBoardSlug(board);
  const payload = boardSchema.parse(
    await fetchJson(
      `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`,
      request,
    ),
  );

  return payload.jobs
    .filter((job) => job.isListed)
    .map((job) => {
      const summary =
        job.compensation?.summaryComponents?.filter(
          (component) => component.compensationType === 'Salary',
        ) ?? [];
      const tiers =
        job.compensation?.compensationTiers
          ?.flatMap((tier) => tier.components)
          .filter((component) => component.compensationType === 'Salary') ?? [];
      const components = summary.length ? summary : tiers;
      const sourceUrl = new URL(job.jobUrl);
      if (
        sourceUrl.protocol !== 'https:' ||
        sourceUrl.hostname !== 'jobs.ashbyhq.com'
      ) {
        throw new Error('Invalid Ashby posting URL');
      }

      return {
        provider: 'ASHBY',
        externalId:
          job.id ??
          sourceUrl.pathname.split('/').filter(Boolean).at(-1) ??
          job.jobUrl,
        title: job.title,
        description:
          job.descriptionPlain ?? postingHtmlToText(job.descriptionHtml ?? ''),
        sourceUrl: job.jobUrl,
        applyUrl: job.applyUrl ?? job.jobUrl,
        location: job.location ?? '',
        workplaceType:
          job.workplaceType === 'Remote'
            ? 'REMOTE'
            : job.workplaceType === 'Hybrid'
              ? 'HYBRID'
              : job.workplaceType === 'OnSite'
                ? 'ON_SITE'
                : 'UNKNOWN',
        publishedAt: job.publishedAt ?? null,
        salaryText:
          job.compensation?.scrapeableCompensationSalarySummary ??
          (components.length > 0
            ? (job.compensation?.compensationTierSummary ?? '')
            : ''),
        salaryRanges: components.map((component) => ({
          currency: component.currencyCode ?? '',
          interval:
            component.interval === '1 YEAR' ? 'YEAR' : component.interval,
          minimum: component.minValue ?? null,
          maximum: component.maxValue ?? null,
        })),
      };
    });
};
