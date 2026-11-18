import { fetchResponse } from './fetch-response';

export const fetchHtml = async (
  url: string,
  request: typeof fetch = fetch,
): Promise<string> => {
  const response = await fetchResponse(url, 'text/html', request);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    throw new Error('Job board did not return an HTML page');
  }
  return response.text();
};
