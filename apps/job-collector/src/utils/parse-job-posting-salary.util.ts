import { load } from 'cheerio/slim';
import { z } from 'zod';

import { type NormalizedJob } from '../types/normalized-job';

const salarySchema = z.object({
  currency: z.string(),
  value: z.object({
    unitText: z.string(),
    minValue: z.number().finite().nonnegative().nullish(),
    maxValue: z.number().finite().nonnegative().nullish(),
    value: z.number().finite().nonnegative().nullish(),
  }),
});

export const parseJobPostingSalary = (
  html: string,
): NormalizedJob['salaryRanges'] => {
  const ranges: NormalizedJob['salaryRanges'] = [];
  for (const element of load(html)(
    'script[type="application/ld+json"]',
  ).toArray()) {
    const text = load(element).text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      continue;
    }
    const entities = z.array(z.unknown()).safeParse(data);
    for (const entity of entities.success ? entities.data : [data]) {
      const posting = z
        .object({ '@type': z.literal('JobPosting'), baseSalary: salarySchema })
        .safeParse(entity);
      if (!posting.success) continue;
      const { currency, value } = posting.data.baseSalary;
      ranges.push({
        currency,
        interval:
          value.unitText.toUpperCase() === 'YEAR' ? 'YEAR' : value.unitText,
        minimum: value.minValue ?? value.value ?? null,
        maximum: value.maxValue ?? value.value ?? null,
      });
    }
  }
  return ranges;
};
