import { expect, it, vi } from 'vitest';
import { fetchHtml } from '../fetch-html';

it('reads HTML pages and requests no redirects', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    new Response('<div>Jobs</div>', {
      headers: { 'content-type': 'text/html' },
    }),
  );
  expect(await fetchHtml('https://example.com/jobs', request)).toBe(
    '<div>Jobs</div>',
  );
  expect(request.mock.calls[0][1]?.redirect).toBe('error');
});
it('refuses a non-HTML response', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ jobs: [] }));
  await expect(fetchHtml('https://example.com/jobs', request)).rejects.toThrow(
    'HTML page',
  );
});
