import { useMemo, useState } from 'react';
import { AppPath, navigate, useTranslate } from 'twenty-sdk/front-component';

import { type AssessmentSummary } from '../services/person-assessment.service';
import {
  CV_RECORD_OBJECTS,
  readWeightedReport,
} from '../twenty-client/review-cv-recommendation';
import { createDashboardMatchingClient } from './dashboard-matching-client';

type AssessmentReportProps = {
  assessment: AssessmentSummary;
  showPosting?: boolean;
};

const openRecord = (objectNameSingular: string, objectRecordId: string) =>
  navigate(AppPath.RecordShowPage, { objectNameSingular, objectRecordId });

export const AssessmentReport = ({
  assessment,
  showPosting,
}: AssessmentReportProps) => {
  const { t } = useTranslate();
  const report = useMemo(
    () => readWeightedReport(assessment.matchReport),
    [assessment.matchReport],
  );
  const [expanded, setExpanded] = useState(false);
  const [decisions, setDecisions] = useState(new Map<string, string>());
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string>();
  const loadDecisions = async () => {
    if (!report?.recommendations.length) return;
    setBusy(true);
    setError(undefined);
    try {
      const records =
        await createDashboardMatchingClient().listRecommendationDecisions(
          assessment.id,
        );
      setDecisions(new Map(records.map(({ id, status }) => [id, status])));
      setBusy(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t('Could not load recommendation decisions.'),
      );
    }
  };

  const review = async (id: string, action: 'apply' | 'dismiss') => {
    setBusy(true);
    setError(undefined);
    try {
      const status = await createDashboardMatchingClient().reviewRecommendation(
        assessment.id,
        id,
        action,
      );
      setDecisions((previous) => new Map(previous).set(id, status));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t('Could not save the recommendation decision.'),
      );
    } finally {
      setBusy(false);
    }
  };

  if (!report) {
    return (
      <button
        type="button"
        onClick={() => openRecord('jobPersonAssessment', assessment.id)}
      >
        {t('Open historical assessment')}
      </button>
    );
  }

  const evidence = (ids: string[]) =>
    report.evidenceRecords
      .filter(({ id }) => ids.includes(id))
      .map(({ id, kind, name }) => (
        <button
          key={id}
          type="button"
          onClick={() =>
            openRecord(
              CV_RECORD_OBJECTS[kind].object.replace(/^./, (first) =>
                first.toLowerCase(),
              ),
              id,
            )
          }
        >
          {name}
        </button>
      ));
  const { coverage } = report;
  const sourcePostingId = assessment.sourcePostingId;
  const matchLabels = {
    explicit: t('Explicit match'),
    semantic: t('Semantic match'),
    unclear: t('Unclear'),
    missing: t('Missing'),
  };
  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(!expanded);
          if (!expanded) void loadDecisions();
        }}
      >
        {assessment.fitScore === null
          ? t('N/A · No candidate qualifications')
          : `${assessment.fitScore}%`}
        {showPosting &&
          assessment.sourcePosting?.name &&
          ` · ${assessment.sourcePosting.name}`}
      </button>
      {expanded && (
        <div>
          <p>
            {t('Points')} {coverage.earnedPoints}/{coverage.availablePoints}
            {' · '}
            {t('Must-have')} {coverage.mustHave.covered}/
            {coverage.mustHave.total}
            {' · '}
            {t('Nice-to-have')} {coverage.niceToHave.covered}/
            {coverage.niceToHave.total}
          </p>
          {sourcePostingId && (
            <p>
              <button
                type="button"
                onClick={() => openRecord('jobSourcePosting', sourcePostingId)}
              >
                {t('Open Source posting')}
              </button>
            </p>
          )}
          <p>{report.recruiterAssessment}</p>
          <p>{report.eligibilityReason}</p>
          {report.keywords.length > 0 && (
            <details>
              <summary>{t('Posting keywords')}</summary>
              <ul>
                {report.keywords.map(({ keyword, recommendation }, index) => (
                  <li key={index}>
                    {keyword} · {recommendation}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {report.requirements.map((requirement) => (
            <details key={requirement.assessments[0].requirementId}>
              <summary>
                {requirement.requirement} ·{' '}
                {requirement.satisfied ? t('Satisfied') : t('Gap')}
              </summary>
              {requirement.assessments.map(
                ({
                  requirementId,
                  sectionHeading,
                  sourceText,
                  alternatives,
                }) => (
                  <div key={requirementId}>
                    <button
                      type="button"
                      onClick={() =>
                        openRecord('jobRequirement', requirementId)
                      }
                    >
                      {sectionHeading ?? t('Posting excerpt')}
                    </button>
                    <blockquote>{sourceText}</blockquote>
                    {alternatives.map(
                      (
                        { skillChecks, qualitativeChecks, satisfied },
                        index,
                      ) => (
                        <div key={index}>
                          {alternatives.length > 1 && (
                            <p>
                              {t('Alternative')} {index + 1} ·{' '}
                              {satisfied ? t('Satisfied') : t('Gap')}
                            </p>
                          )}
                          <ul>
                            {skillChecks.map(({ id, name, evidenceIds }) => (
                              <li key={id}>
                                {name} ·{' '}
                                {evidenceIds.length
                                  ? t('Skill found')
                                  : t('Skill missing')}{' '}
                                {evidence(evidenceIds)}
                              </li>
                            ))}
                            {qualitativeChecks.map(
                              ({
                                checkId,
                                match,
                                description,
                                explanation,
                                evidenceIds,
                              }) => (
                                <li key={checkId}>
                                  {description} · {matchLabels[match]} ·{' '}
                                  {explanation} {evidence(evidenceIds)}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                ),
              )}
            </details>
          ))}
          <h3>{t('Recommendations')}</h3>
          {error && <p role="alert">{error}</p>}
          {report.recommendations.length === 0 &&
            report.questions.length === 0 && <p>{t('No recommendations.')}</p>}
          {report.recommendations.map((proposal) => {
            const status = decisions.get(proposal.id);
            return (
              <article key={proposal.id}>
                <p>
                  <button
                    type="button"
                    onClick={() =>
                      openRecord('jobRequirement', proposal.requirementId)
                    }
                  >
                    {proposal.requirementName}
                  </button>
                </p>
                <p>
                  {t('Target record')} {evidence([proposal.targetId])}
                </p>
                {proposal.kind === 'text' ? (
                  <dl>
                    <dt>{t('Original')}</dt>
                    <dd>{proposal.original ?? t('Empty')}</dd>
                    <dt>{t('Proposed wording')}</dt>
                    <dd>{proposal.proposed}</dd>
                  </dl>
                ) : (
                  <p>
                    {t('Link Skill')} {proposal.skillName}
                  </p>
                )}
                <p>
                  {t('Evidence')} {evidence(proposal.evidenceIds)}
                </p>
                {proposal.potentialPoints > 0 && status !== 'dismissed' && (
                  <p>
                    {t('Potential points on reassessment')} +
                    {proposal.potentialPoints}
                  </p>
                )}
                {status === 'applied' ? (
                  <p>{t('Applied')}</p>
                ) : status === 'dismissed' ? (
                  <p>{t('Dismissed')}</p>
                ) : (
                  <p>
                    {t('Proposed')}{' '}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void review(proposal.id, 'apply')}
                    >
                      {t('Apply')}
                    </button>{' '}
                    <button
                      type="button"
                      disabled={busy || status === 'applying'}
                      onClick={() => void review(proposal.id, 'dismiss')}
                    >
                      {t('Dismiss')}
                    </button>
                  </p>
                )}
              </article>
            );
          })}
          {report.questions.length > 0 && (
            <ul>
              {report.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          )}
          <p>
            <button
              type="button"
              onClick={() => openRecord('jobPersonAssessment', assessment.id)}
            >
              {t('Open assessment record')}
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
