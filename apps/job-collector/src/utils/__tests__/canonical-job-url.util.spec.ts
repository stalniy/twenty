import { expect, it } from 'vitest';
import { canonicalJobUrl } from '../canonical-job-url.util';

it('removes tracking and an apply suffix while retaining job identity', () => {
  expect(
    canonicalJobUrl(
      'https://jobs.example.com/apply?jobId=123&utm_source=linkedin#apply',
    ),
  ).toBe('https://jobs.example.com/?jobId=123');
  expect(
    canonicalJobUrl('https://jobs.example.com/opening/apply?source=linkedin'),
  ).toBe('https://jobs.example.com/opening');
  expect(canonicalJobUrl('https://jobs.example.com/?jobId=456')).not.toBe(
    canonicalJobUrl('https://jobs.example.com/?jobId=123'),
  );
});
it('refuses non-HTTPS links', () => {
  expect(() => canonicalJobUrl('javascript:alert(1)')).toThrow('HTTPS');
});
