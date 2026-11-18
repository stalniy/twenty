export const canonicalJobUrl = (value: string): string => {
  const url = new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error('Job URLs must use HTTPS');
  }

  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_.+|source|ref|referrer|lever-source|gh_src)$/i.test(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/apply\/?$/, '').replace(/\/$/, '');
  return url.toString();
};
