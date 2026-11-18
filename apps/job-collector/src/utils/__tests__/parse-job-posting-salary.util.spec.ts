import { expect, it } from 'vitest';
import { parseJobPostingSalary } from '../parse-job-posting-salary.util';

it('reads explicit currency and pay period without converting hourly salaries', () => {
  const html =
    '<script type="application/ld+json">{"@type":"JobPosting","baseSalary":{"currency":"CAD","value":{"unitText":"HOUR","value":80}}}</script>';
  expect(parseJobPostingSalary(html)).toEqual([
    { currency: 'CAD', interval: 'HOUR', minimum: 80, maximum: 80 },
  ]);
});
it('ignores unrelated or malformed structured data', () => {
  expect(
    parseJobPostingSalary(
      '<script type="application/ld+json">broken</script><script type="application/ld+json">{"@type":"Organization","baseSalary":{"currency":"USD"}}</script>',
    ),
  ).toEqual([]);
});
it('supports an array of structured entities and nullable range bounds', () => {
  expect(
    parseJobPostingSalary(
      '<script type="application/ld+json">[{"@type":"Organization"},{"@type":"JobPosting","baseSalary":{"currency":"USD","value":{"unitText":"YEAR","minValue":null,"maxValue":150000}}}]</script>',
    ),
  ).toEqual([
    { currency: 'USD', interval: 'YEAR', minimum: null, maximum: 150000 },
  ]);
});
