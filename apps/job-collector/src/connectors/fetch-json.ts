import { fetchResponse } from './fetch-response';

export const fetchJson = async (
  url: string,
  request: typeof fetch = fetch,
): Promise<unknown> => {
  const response = await fetchResponse(url, 'application/json', request);
  return response.json();
};
