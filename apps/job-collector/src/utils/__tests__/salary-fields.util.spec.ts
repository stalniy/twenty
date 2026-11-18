import { describe, expect, it } from 'vitest';
import { createJob } from '../../services/__tests__/fixtures';
import { salaryFields } from '../salary-fields.util';

describe('salary priority', () => {
  it.each([
    [150001, 'OVER_150K'],
    [150000, 'OVER_100K'],
    [100001, 'OVER_100K'],
    [100000, 'UP_TO_100K'],
  ])('classifies a minimum of %i as %s', (minimum, priority) => {
    expect(
      salaryFields(
        createJob({
          salaryRanges: [
            {
              currency: 'USD',
              interval: 'YEAR',
              minimum: Number(minimum),
              maximum: 200000,
            },
          ],
        }),
      ).salaryPriority,
    ).toBe(priority);
  });
  it('uses the lowest minimum across regional tiers', () => {
    const result = salaryFields(
      createJob({
        salaryRanges: [
          {
            currency: 'USD',
            interval: 'YEAR',
            minimum: 170000,
            maximum: 220000,
          },
          {
            currency: 'USD',
            interval: 'YEAR',
            minimum: 90000,
            maximum: 160000,
          },
        ],
      }),
    );
    expect(result).toEqual({
      salaryMinimumUsd: 90000,
      salaryMaximumUsd: 220000,
      salaryPriority: 'UP_TO_100K',
    });
  });
  it.each([
    ['CAD', 'YEAR'],
    ['USD', 'HOUR'],
  ])('does not convert %s/%s', (currency, interval) => {
    expect(
      salaryFields(
        createJob({
          salaryRanges: [
            { currency, interval, minimum: 180000, maximum: 200000 },
          ],
        }),
      ),
    ).toEqual({
      salaryMinimumUsd: null,
      salaryMaximumUsd: null,
      salaryPriority: 'OTHER_COMPENSATION',
    });
  });
  it('distinguishes missing salaries from an unstructured salary', () => {
    expect(salaryFields(createJob()).salaryPriority).toBe('NO_SALARY');
    expect(
      salaryFields(createJob({ salaryText: '$150k–$200k' })).salaryPriority,
    ).toBe('OTHER_COMPENSATION');
  });
});
