import { postingHtmlToText } from '../utils/posting-html-to-text.util';
import { load } from 'cheerio/slim';

import { type JobBoard } from '../types/job-board';
import { type NormalizedJob } from '../types/normalized-job';
import { parseBoardSlug } from '../utils/parse-board-slug.util';
import { fetchResponse } from './fetch-response';

const FYUL_ORIGIN = 'https://careers.fyul.com';
const PAGE_SIZE = 100;
const MAXIMUM_PAGES = 20;

const parseFeed = (xml: string): NormalizedJob[] => {
  const document = load(xml, { xmlMode: true });
  const channel = document('rss > channel');
  if (channel.length !== 1)
    throw new Error('FYUL did not return a valid RSS job feed');

  return channel
    .children('item')
    .toArray()
    .map((element) => {
      const item = document(element);
      const externalId = item.children('guid').text().trim();
      const title = item.children('title').text().trim();
      const descriptionHtml = item.children('description').text();
      const descriptionText = postingHtmlToText(descriptionHtml);
      if (!externalId || !title || !descriptionText) {
        throw new Error(
          'FYUL RSS job is missing its identifier, title, or description',
        );
      }

      const link = item.children('link').text().trim();
      const sourceUrl = new URL(link);
      if (
        sourceUrl.origin !== FYUL_ORIGIN ||
        sourceUrl.username ||
        sourceUrl.password ||
        !/^\/jobs\/\d+(?:-[^/]+)?\/?$/.test(sourceUrl.pathname) ||
        sourceUrl.search ||
        sourceUrl.hash
      ) {
        throw new Error('FYUL RSS job has an invalid public posting URL');
      }

      const locations = item
        .find('tt\\:locations > tt\\:location, locations > location')
        .toArray()
        .map((location) => {
          const value = document(location);
          const name = value.children('tt\\:name, name').text().trim();
          if (name) return name;
          return [
            value.children('tt\\:city, city').text().trim(),
            value.children('tt\\:country, country').text().trim(),
          ]
            .filter(Boolean)
            .join(', ');
        })
        .filter(Boolean);
      const remoteStatus = item.children('remoteStatus').text().trim();
      const publicationDate = item.children('pubDate').text().trim();
      const publicationTimestamp = Date.parse(publicationDate);

      return {
        provider: 'FYUL',
        externalId,
        title,
        description: descriptionText,
        sourceUrl: sourceUrl.href,
        applyUrl: sourceUrl.href,
        location: [...new Set(locations)].join('; '),
        workplaceType:
          remoteStatus === 'fully'
            ? 'REMOTE'
            : remoteStatus === 'hybrid'
              ? 'HYBRID'
              : remoteStatus === 'onsite'
                ? 'ON_SITE'
                : 'UNKNOWN',
        publishedAt: Number.isFinite(publicationTimestamp)
          ? new Date(publicationTimestamp).toISOString()
          : null,
        salaryText: '',
        salaryRanges: [],
      };
    });
};

export const fetchFyulJobs = async (
  board: JobBoard,
  request: typeof fetch = fetch,
): Promise<NormalizedJob[]> => {
  parseBoardSlug(board);
  const jobs: NormalizedJob[] = [];
  const identifiers = new Set<string>();

  for (let page = 0; page < MAXIMUM_PAGES; page++) {
    const url = `${FYUL_ORIGIN}/jobs.rss?offset=${page * PAGE_SIZE}&per_page=${PAGE_SIZE}`;
    const response = await fetchResponse(
      url,
      'application/rss+xml, application/xml, text/xml',
      request,
    );
    const contentType = response.headers.get('content-type') ?? '';
    if (!/(?:application\/(?:rss\+)?xml|text\/xml)/i.test(contentType)) {
      throw new Error('FYUL did not return an XML job feed');
    }
    const postings = parseFeed(await response.text());
    let added = 0;
    for (const posting of postings) {
      if (identifiers.has(posting.externalId)) continue;
      identifiers.add(posting.externalId);
      jobs.push(posting);
      added++;
    }
    if (postings.length < PAGE_SIZE) return jobs;
    if (added === 0) throw new Error('FYUL feed pagination made no progress');
  }
  throw new Error('FYUL feed exceeded the maximum number of pages');
};
