import { afterEach, expect, it, vi } from 'vitest';
import { fetchResponse } from '../fetch-response';

afterEach(() => vi.useRealTimers());
it('bounds retries and honors the request content type', async () => {
  vi.useFakeTimers();
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response('', { status: 503 }));
  const pending = expect(
    fetchResponse('https://example.com/jobs', 'text/html', request),
  ).rejects.toThrow('HTTP 503');
  await vi.runAllTimersAsync();
  await pending;
  expect(request).toHaveBeenCalledTimes(3);
  expect(request.mock.calls[0][1]?.headers).toEqual({ Accept: 'text/html' });
});
it('never retries authentication failures', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('', { status: 403 }));
  await expect(
    fetchResponse('https://example.com/jobs', 'text/html', request),
  ).rejects.toThrow('HTTP 403');
  expect(request).toHaveBeenCalledTimes(1);
});
