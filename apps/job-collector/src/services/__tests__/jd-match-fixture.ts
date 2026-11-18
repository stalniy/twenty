import { type z } from 'zod';

import { type qualitativeAssessmentSchema } from '../job-requirements.service';

export const JD_MATCH_ASSESSMENT: z.infer<typeof qualitativeAssessmentSchema> =
  {
    judgments: [],
    recommendations: [],
    keywords: [],
    questions: [],
    recruiterAssessment: 'Review the underlying qualifications.',
    fitEligibility: 'UNKNOWN',
    eligibilityReason: 'Location eligibility is unclear.',
  };
