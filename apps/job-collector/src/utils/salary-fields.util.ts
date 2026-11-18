import { type NormalizedJob } from '../types/normalized-job';
import { type SalaryFields } from '../types/salary-fields';

export const salaryFields = (job: NormalizedJob): SalaryFields => {
  const annualUsdRanges = job.salaryRanges.filter(
    (range) => range.currency === 'USD' && range.interval === 'YEAR',
  );
  const minimums = annualUsdRanges
    .map((range) => range.minimum)
    .filter((value): value is number => value !== null && value >= 0);
  const maximums = annualUsdRanges
    .map((range) => range.maximum)
    .filter((value): value is number => value !== null && value >= 0);
  const salaryMinimumUsd = minimums.length ? Math.min(...minimums) : null;
  const salaryMaximumUsd = maximums.length ? Math.max(...maximums) : null;
  const hasSalary =
    job.salaryRanges.length > 0 || job.salaryText.trim().length > 0;

  return {
    salaryMinimumUsd,
    salaryMaximumUsd,
    salaryPriority:
      salaryMinimumUsd === null
        ? hasSalary
          ? 'OTHER_COMPENSATION'
          : 'NO_SALARY'
        : salaryMinimumUsd > 150000
          ? 'OVER_150K'
          : salaryMinimumUsd > 100000
            ? 'OVER_100K'
            : 'UP_TO_100K',
  };
};
