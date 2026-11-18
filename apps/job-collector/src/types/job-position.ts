export type JobPosition = {
  id: string;
  companyId: string | null;
  location: string | null;
  joburl: { primaryLinkUrl: string | null } | null;
};
