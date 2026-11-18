import { load } from 'cheerio';

export const postingHtmlToText = (html: string) => {
  const document = load(html);
  document('script, style').remove();
  document('br').replaceWith('\n');
  document('h1, h2, h3, h4, h5, h6, p, div, li').append('\n');
  return document.text().trim();
};
