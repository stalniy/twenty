import { expect, it } from 'vitest';

import { WEIGHTED_REQUIREMENT_SCORING } from '../jd-match-assessment.service';
import { combineRequirementAssessment } from '../job-requirements.service';
import { JD_MATCH_ASSESSMENT } from './jd-match-fixture';

it('saves zero qualifications as a completed report with a null score', () => {
  const result = combineRequirementAssessment(
    [],
    JSON.stringify(JD_MATCH_ASSESSMENT),
    [],
  );
  expect(result.fitScore).toBeNull();
  expect(result.report).toMatchObject({
    scoringMethod: WEIGHTED_REQUIREMENT_SCORING,
    coverage: { earnedPoints: 0, availablePoints: 0 },
    requirements: [],
  });
});
