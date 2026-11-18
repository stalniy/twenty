import { defineApplication, FieldType } from 'twenty-sdk/define';

import { IDENTIFIERS } from './src/constants/identifiers';
import { DEFAULT_CANDIDATE_PROFILE } from './src/constants/candidate-profile';
import { DEFAULT_CANDIDATE_RESUME } from './src/constants/candidate-resume';

export const application = defineApplication({
  universalIdentifier: IDENTIFIERS.APPLICATION,
  displayName: 'Job Collector',
  description:
    'Collect remote software engineering jobs from company job boards.',
  applicationVariables: {
    CANDIDATE_RESUME: {
      universalIdentifier: IDENTIFIERS.RESUME_VARIABLE,
      description:
        'Installed structured résumé used to initialize editable Master CV records.',
      type: FieldType.TEXT,
      value: DEFAULT_CANDIDATE_RESUME,
    },
    CANDIDATE_PROFILE: {
      universalIdentifier: IDENTIFIERS.PROFILE_VARIABLE,
      description: 'Legacy résumé summary retained for existing installations.',
      type: FieldType.TEXT,
      value: DEFAULT_CANDIDATE_PROFILE,
    },
    JOB_COLLECTOR_OWNER_EMAIL: {
      universalIdentifier: IDENTIFIERS.OWNER_EMAIL_VARIABLE,
      description:
        'Workspace owner email. Required for the default assignment in a workspace with multiple members.',
      type: FieldType.TEXT,
      value: '',
    },
    MATCH_BATCH_SIZE: {
      universalIdentifier: IDENTIFIERS.MATCH_BATCH_VARIABLE,
      description:
        'Maximum pending postings scored per workflow run (1–100). Unchanged assessments are reused.',
      type: FieldType.TEXT,
      value: '25',
    },
    COLLECTOR_API_URL: {
      universalIdentifier: IDENTIFIERS.API_URL_VARIABLE,
      description:
        'Optional API address reachable from the server and worker. Leave empty to use Twenty’s runtime address.',
      type: FieldType.TEXT,
      value: '',
    },
    JOB_KEYWORD: {
      universalIdentifier: IDENTIFIERS.KEYWORD_VARIABLE,
      description:
        'Keywords separated by commas, semicolons, or newlines. Requires any keyword as a whole word in the title or description.',
      type: FieldType.TEXT,
      value: 'TypeScript',
    },
    ASHBY_COMPANY_SLUG_FIELD: {
      universalIdentifier: IDENTIFIERS.LEGACY_SLUG_VARIABLE,
      description:
        'Existing company field used to seed Ashby boards on installation.',
      type: FieldType.TEXT,
      value: 'ashbyhqSlug',
    },
  },
});
