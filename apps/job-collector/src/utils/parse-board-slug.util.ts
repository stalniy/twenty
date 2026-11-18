import { type JobBoard } from '../types/job-board';

export const parseBoardSlug = (board: JobBoard): string => {
  let slug = board.slug.trim();
  if (board.provider === 'THE_AA') {
    if (slug === 'the-aa') return slug;
    const url = new URL(slug);
    if (
      url.origin !== 'https://www.theaacareers.co.uk' ||
      !['/', '/apply', '/apply/'].includes(url.pathname) ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw new Error('A The AA company board URL is required');
    }
    return 'the-aa';
  }
  if (board.provider === 'ELASTIC' || board.provider === 'FYUL') {
    const expectedSlug = board.provider === 'ELASTIC' ? 'elastic' : 'fyul';
    const hostname =
      board.provider === 'ELASTIC' ? 'jobs.elastic.co' : 'careers.fyul.com';
    if (slug === expectedSlug) return expectedSlug;
    const url = new URL(slug);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== hostname ||
      !['/', '/jobs', '/jobs/'].includes(url.pathname) ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      url.port
    ) {
      throw new Error(`A ${expectedSlug} company board URL is required`);
    }
    return expectedSlug;
  }
  if (/^https?:\/\//i.test(slug)) {
    const url = new URL(slug);
    const hosts =
      board.provider === 'ASHBY'
        ? ['jobs.ashbyhq.com']
        : board.provider === 'WORK_AT_A_STARTUP'
          ? [
              'www.workatastartup.com',
              'workatastartup.com',
              'www.ycombinator.com',
              'ycombinator.com',
            ]
          : ['jobs.lever.co', 'jobs.eu.lever.co'];
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname)) {
      throw new Error('Board URL does not belong to the configured provider');
    }
    const segments = url.pathname.split('/').filter(Boolean);
    if (
      board.provider === 'WORK_AT_A_STARTUP' &&
      (segments[0] !== 'companies' ||
        segments.length < 2 ||
        segments.length > 3 ||
        (segments.length === 3 && segments[2] !== 'jobs'))
    ) {
      throw new Error('A Work at a Startup or YC company URL is required');
    }
    slug = segments[board.provider === 'WORK_AT_A_STARTUP' ? 1 : 0] ?? '';
  }

  slug = decodeURIComponent(slug.replace(/^\/+|\/+$/g, ''));
  if (!slug || /[/?#]/.test(slug)) {
    throw new Error('A company board slug is required');
  }
  return encodeURIComponent(slug);
};
