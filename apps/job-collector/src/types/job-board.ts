export type JobBoard = {
  id: string;
  name: string;
  provider:
    | 'ASHBY'
    | 'LEVER'
    | 'WORK_AT_A_STARTUP'
    | 'ELASTIC'
    | 'FYUL'
    | 'THE_AA';
  slug: string;
  region: 'GLOBAL' | 'EU';
  companyId: string;
};
