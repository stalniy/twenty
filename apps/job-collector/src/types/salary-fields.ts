export type SalaryFields = {
  salaryMinimumUsd: number | null;
  salaryMaximumUsd: number | null;
  salaryPriority:
    | 'OVER_150K'
    | 'OVER_100K'
    | 'NO_SALARY'
    | 'OTHER_COMPENSATION'
    | 'UP_TO_100K';
};
