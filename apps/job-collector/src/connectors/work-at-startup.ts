import { postingHtmlToText } from '../utils/posting-html-to-text.util';
import { z } from 'zod';

import { type JobBoard } from '../types/job-board';
import { type NormalizedJob } from '../types/normalized-job';
import { parseBoardSlug } from '../utils/parse-board-slug.util';
import { parseInertiaPage } from '../utils/parse-inertia-page.util';
import { parseJobPostingSalary } from '../utils/parse-job-posting-salary.util';
import { fetchHtml } from './fetch-html';

const identifierSchema = z.union([
  z.string().min(1),
  z.number().int().positive(),
]);
const companySchema = z.object({ slug: z.string().min(1) });
const summarySchema = z.object({
  id: identifierSchema,
  title: z.string().min(1),
  location: z.string().nullish(),
  salaryRange: z.string().nullish(),
});
const companyPageSchema = z.object({
  component: z.literal('jobs/public/pages/CompanyV2Page'),
  props: z.object({
    company: companySchema.extend({ jobs: z.array(summarySchema) }),
  }),
});
const directoryPageSchema = z.object({
  component: z.literal('WaasShowJobsPage'),
  props: z.object({
    company: companySchema,
    jobPostings: z.array(
      z.object({ id: identifierSchema, url: z.string().min(1) }),
    ),
  }),
});
const jobPageSchema = z.object({
  component: z.literal('WaasShowJobPage'),
  props: z.object({
    company: companySchema,
    job: summarySchema.extend({
      description: z.string().trim().min(1),
      applyUrl: z.string().nullish(),
    }),
  }),
});

const workplaceType = (location: string): NormalizedJob['workplaceType'] => {
  if (/\b(hybrid|partly remote|partially remote)\b/i.test(location))
    return 'HYBRID';
  if (/\b(on[- ]?site|in[- ]office)\b/i.test(location)) return 'ON_SITE';
  return /\bremote\b/i.test(location) ? 'REMOTE' : 'UNKNOWN';
};

const assertCompany = (actual: string, expected: string) => {
  if (actual.toLowerCase() !== decodeURIComponent(expected).toLowerCase()) {
    throw new Error('Public job page belongs to a different company');
  }
};

export const fetchWorkAtStartupJobs = async (
  board: JobBoard,
  request: typeof fetch = fetch,
): Promise<NormalizedJob[]> => {
  const slug = parseBoardSlug(board);
  const companyPage = companyPageSchema.parse(
    parseInertiaPage(
      await fetchHtml(
        `https://www.workatastartup.com/companies/${slug}`,
        request,
      ),
    ),
  );
  assertCompany(companyPage.props.company.slug, slug);
  const remoteJobs = companyPage.props.company.jobs.filter(
    (job) => workplaceType(job.location ?? '') === 'REMOTE',
  );
  if (remoteJobs.length === 0) return [];

  const directory = directoryPageSchema.parse(
    parseInertiaPage(
      await fetchHtml(
        `https://www.ycombinator.com/companies/${slug}/jobs`,
        request,
      ),
    ),
  );
  assertCompany(directory.props.company.slug, slug);
  const urlsByIdentifier = new Map(
    directory.props.jobPostings.map((job) => [String(job.id), job.url]),
  );
  const fetchJob = async (
    summary: z.infer<typeof summarySchema>,
  ): Promise<NormalizedJob> => {
    const identifier = String(summary.id);
    const path = urlsByIdentifier.get(identifier);
    if (!path)
      throw new Error(
        `Public YC description URL is unavailable for job ${identifier}`,
      );
    const sourceUrl = new URL(path, 'https://www.ycombinator.com');
    if (
      sourceUrl.protocol !== 'https:' ||
      sourceUrl.hostname !== 'www.ycombinator.com' ||
      !sourceUrl.pathname.startsWith(`/companies/${slug}/jobs/`)
    ) {
      throw new Error(
        `Invalid public YC description URL for job ${identifier}`,
      );
    }

    const html = await fetchHtml(sourceUrl.href, request);
    const page = jobPageSchema.parse(parseInertiaPage(html));
    assertCompany(page.props.company.slug, slug);
    if (String(page.props.job.id) !== identifier)
      throw new Error('Public YC description belongs to a different job');
    const job = page.props.job;
    const description = postingHtmlToText(job.description);
    let applyUrl = sourceUrl.href;
    if (job.applyUrl) {
      const candidate = new URL(job.applyUrl, sourceUrl);
      // YC sign-in URLs are not a stable application identity across sources.
      if (
        candidate.protocol === 'https:' &&
        ![
          'account.ycombinator.com',
          'www.workatastartup.com',
          'workatastartup.com',
          'www.ycombinator.com',
          'ycombinator.com',
        ].includes(candidate.hostname)
      ) {
        applyUrl = candidate.href;
      }
    }
    return {
      provider: 'WORK_AT_A_STARTUP',
      externalId: identifier,
      title: job.title,
      description,
      sourceUrl: sourceUrl.href,
      applyUrl,
      location: job.location?.trim() || summary.location || '',
      workplaceType: workplaceType(
        job.location?.trim() || summary.location || '',
      ),
      publishedAt: null,
      salaryText: job.salaryRange || summary.salaryRange || '',
      salaryRanges: parseJobPostingSalary(html),
    };
  };
  const jobs: NormalizedJob[] = new Array(remoteJobs.length);
  let nextIndex = 0;
  let failure: Error | undefined;
  await Promise.all(
    Array.from({ length: Math.min(2, remoteJobs.length) }, async () => {
      while (!failure && nextIndex < remoteJobs.length) {
        const index = nextIndex++;
        try {
          jobs[index] = await fetchJob(remoteJobs[index]);
        } catch (error) {
          failure ??= error instanceof Error ? error : new Error(String(error));
        }
      }
    }),
  );
  if (failure) throw failure;
  return jobs;
};
