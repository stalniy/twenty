import { afterEach, expect, it, vi } from 'vitest';
import { fetchJson } from '../fetch-json';

afterEach(() => vi.useRealTimers());
it('retries a transient failure and stops on success', async () => {
  vi.useFakeTimers();
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      new Response('', { status: 429, headers: { 'retry-after': '1' } }),
    )
    .mockResolvedValueOnce(Response.json({ jobs: [] }));
  const pending = fetchJson('https://api.example.com/jobs', request);
  await vi.runAllTimersAsync();
  await expect(pending).resolves.toEqual({ jobs: [] });
  expect(request).toHaveBeenCalledTimes(2);
});
it('does not retry a missing board', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('', { status: 404 }));
  await expect(
    fetchJson('https://api.example.com/jobs', request),
  ).rejects.toThrow('404');
  expect(request).toHaveBeenCalledTimes(1);
});
