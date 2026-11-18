export const fetchResponse = async (
  url: string,
  accept: string,
  request: typeof fetch = fetch,
): Promise<Response> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await request(url, {
      headers: { Accept: accept },
      signal: AbortSignal.timeout(20000),
      redirect: 'error',
    });
    if (response.ok) return response;
    if (attempt < 2 && [429, 500, 502, 503, 504].includes(response.status)) {
      const seconds = Number(response.headers.get('retry-after'));
      const delay =
        Number.isFinite(seconds) && seconds > 0
          ? seconds * 1000
          : 1000 * (attempt + 1);
      await response.body?.cancel();
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(delay, 20000)),
      );
      continue;
    }
    await response.body?.cancel();
    throw new Error(`Job board HTTP ${response.status}`);
  }
  throw new Error('Job board retry limit exceeded');
};
