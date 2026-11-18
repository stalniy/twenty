import { load } from 'cheerio/slim';

export const parseInertiaPage = (html: string): unknown => {
  const elements = load(html)('[data-page]');
  if (elements.length !== 1) {
    throw new Error('Public job page is missing its embedded page data');
  }
  const serialized = elements.attr('data-page');
  if (!serialized) throw new Error('Public job page data is empty');
  return JSON.parse(serialized) as unknown;
};
