export type NormalizedJob = {
  provider:
    | 'ASHBY'
    | 'LEVER'
    | 'WORK_AT_A_STARTUP'
    | 'ELASTIC'
    | 'FYUL'
    | 'THE_AA';
  externalId: string;
  title: string;
  description: string;
  sourceUrl: string;
  applyUrl: string;
  location: string;
  workplaceType: 'REMOTE' | 'HYBRID' | 'ON_SITE' | 'UNKNOWN';
  publishedAt: string | null;
  salaryText: string;
  salaryRanges: {
    currency: string;
    interval: string;
    minimum: number | null;
    maximum: number | null;
  }[];
};
