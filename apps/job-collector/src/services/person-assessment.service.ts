import { WEIGHTED_REQUIREMENT_SCORING } from './jd-match-assessment.service';

export type AssessmentSummary = {
  id: string;
  sourcePostingId: string | null;
  sourcePosting: { jobPositionId: string | null; name?: string } | null;
  legacyPositionId: string | null;
  scoringMethod?: string | null;
  fitScore: number | null;
  profileMatchedAt: string | null;
  matchReport: string | null;
};

export const ASSESSMENT_SUMMARY_FIELDS =
  'id sourcePostingId sourcePosting{jobPositionId name} legacyPositionId scoringMethod fitScore profileMatchedAt matchReport';

const compareAssessments = (
  left: AssessmentSummary,
  right: AssessmentSummary,
) => {
  const leftCurrent = left.scoringMethod === WEIGHTED_REQUIREMENT_SCORING;
  const rightCurrent = right.scoringMethod === WEIGHTED_REQUIREMENT_SCORING;
  if (leftCurrent !== rightCurrent) return leftCurrent ? 1 : -1;
  if (leftCurrent && left.fitScore !== right.fitScore)
    return (left.fitScore ?? -1) - (right.fitScore ?? -1);
  const sourcePreference =
    Number(Boolean(left.sourcePostingId)) -
    Number(Boolean(right.sourcePostingId));
  return (
    sourcePreference ||
    (left.profileMatchedAt ?? '').localeCompare(right.profileMatchedAt ?? '')
  );
};

export const assessmentPositionId = (assessment: AssessmentSummary) =>
  assessment.sourcePostingId
    ? assessment.sourcePosting?.jobPositionId
    : assessment.legacyPositionId;

export const bestAssessmentsByPosition = (assessments: AssessmentSummary[]) => {
  const best = new Map<string, AssessmentSummary>();
  for (const assessment of assessments) {
    const positionId = assessmentPositionId(assessment);
    if (!positionId) continue;
    const current = best.get(positionId);
    if (!current || compareAssessments(assessment, current) > 0)
      best.set(positionId, assessment);
  }
  return best;
};
