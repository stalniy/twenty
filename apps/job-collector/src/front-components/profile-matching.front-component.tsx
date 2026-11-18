import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { defineFrontComponent, PageLayoutType } from 'twenty-sdk/define';
import {
  AppPath,
  getApplicationVariable,
  navigate,
  useTranslate,
} from 'twenty-sdk/front-component';

import { AssessmentReport } from './assessment-report';
import { WEIGHTED_REQUIREMENT_SCORING } from '../services/jd-match-assessment.service';
import { IDENTIFIERS } from '../constants/identifiers';
import { type AssessmentSummary } from '../services/person-assessment.service';
import { type MatchingPerson } from '../services/matching-person.service';
import {
  createDashboardMatchingClient,
  type DashboardJob,
} from './dashboard-matching-client';

const CONTROL_STYLE: CSSProperties = {
  font: 'inherit',
  color: 'var(--t-font-color-primary)',
  background: 'var(--t-background-primary)',
  border: '1px solid var(--t-border-color-medium)',
  borderRadius: 'var(--t-border-radius-sm)',
  padding: 'var(--t-spacing-2)',
  minHeight: 32,
};
const ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 'var(--t-spacing-2)',
  alignItems: 'center',
  flexWrap: 'wrap',
};
const CELL_STYLE: CSSProperties = {
  padding: 'var(--t-spacing-2)',
  borderBottom: '1px solid var(--t-border-color-light)',
  textAlign: 'left',
};

type ProfileMatchingProps = {
  recordIds?: string[];
  recordFilter?: Record<string, unknown>;
};

export const ProfileMatching = ({
  recordIds,
  recordFilter,
}: ProfileMatchingProps) => {
  const { t } = useTranslate();
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [people, setPeople] = useState<MatchingPerson[]>([]);
  const [personId, setPersonId] = useState('');
  const [assessments, setAssessments] = useState(
    new Map<string, AssessmentSummary>(),
  );
  const [otherAssessments, setOtherAssessments] = useState(
    new Map<string, AssessmentSummary[]>(),
  );
  const [hasMasterCv, setHasMasterCv] = useState(false);
  const [loadingPerson, setLoadingPerson] = useState(true);
  const personRequest = useRef(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filtered, setFiltered] = useState(true);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string>();
  useEffect(() => {
    if (!runId) return;
    let active = true;
    const refresh = async () => {
      const client = createDashboardMatchingClient();
      const status = await client.getRunStatus(runId);
      if (!active) return;
      setRunStatus(status);
      if (
        status === 'COMPLETED' ||
        status === 'FAILED' ||
        status === 'STOPPED'
      ) {
        const result = await client.listBestAssessments(personId);
        if (active) {
          setAssessments(result.bestAssessments);
          setOtherAssessments(result.otherAssessments);
        }
      } else {
        timer = setTimeout(check, 4000);
      }
    };
    const check = () =>
      void refresh().catch(() => {
        if (active) timer = setTimeout(check, 10000);
      });
    let timer: ReturnType<typeof setTimeout>;
    check();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [runId, personId]);

  const rankingScore = (id: string) => {
    const assessment = assessments.get(id);
    return assessment?.scoringMethod === WEIGHTED_REQUIREMENT_SCORING
      ? (assessment.fitScore ?? -1)
      : -1;
  };
  const visibleJobs = jobs
    .filter((job) =>
      `${job.name} ${job.company?.name ?? ''} ${job.location ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((left, right) => rankingScore(right.id) - rankingScore(left.id));
  const busy = loading || starting || loadingPerson;
  const activeIds = recordIds ? jobs.map(({ id }) => id) : selectedIds;

  const loadPerson = async (assignedPersonId: string) => {
    const request = ++personRequest.current;
    setPersonId(assignedPersonId);
    setAssessments(new Map());
    setOtherAssessments(new Map());
    setHasMasterCv(false);
    setError(null);
    setLoadingPerson(Boolean(assignedPersonId));
    if (!assignedPersonId) return;
    try {
      const result =
        await createDashboardMatchingClient().listBestAssessments(
          assignedPersonId,
        );
      if (request === personRequest.current) {
        setAssessments(result.bestAssessments);
        setOtherAssessments(result.otherAssessments);
        setHasMasterCv(result.hasMasterCv);
      }
    } catch (loadError) {
      if (request === personRequest.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('Could not load CV matching results.'),
        );
      }
    } finally {
      if (request === personRequest.current) setLoadingPerson(false);
    }
  };

  useEffect(() => {
    let active = true;
    const client = createDashboardMatchingClient();
    client
      .listPeople(getApplicationVariable('JOB_COLLECTOR_OWNER_EMAIL'))
      .then(({ people, suggestedPersonId }) => {
        if (!active) return;
        setPeople(people);
        void loadPerson(suggestedPersonId);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setLoadingPerson(false);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('Could not load CRM People.'),
        );
      });
    return () => {
      active = false;
      personRequest.current++;
    };
  }, []);

  const recordSelection = recordIds?.join(',');
  const recordSelectionFilter = recordFilter
    ? JSON.stringify(recordFilter)
    : '';
  useEffect(() => {
    if (!recordSelection && !recordSelectionFilter) return;
    let active = true;
    setJobs([]);
    setLoaded(false);
    setLoading(true);
    createDashboardMatchingClient()
      .listSelectedJobs(
        recordSelection ? recordSelection.split(',') : [],
        recordSelectionFilter ? JSON.parse(recordSelectionFilter) : undefined,
      )
      .then((records) => {
        if (!active) return;
        setJobs(records);
        setLoaded(true);
      })
      .catch((loadError: unknown) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : t('Could not load jobs.'),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [recordSelection, recordSelectionFilter]);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    setSelectedIds([]);
    try {
      setJobs(await createDashboardMatchingClient().listJobs(filtered));
      setLoaded(true);
      if (personId) await loadPerson(personId);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t('Could not load jobs.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const matchJobs = async (single: boolean) => {
    setStarting(true);
    setError(null);
    setRunId(null);
    setRunStatus(undefined);
    try {
      setRunId(
        await createDashboardMatchingClient().startMatching(
          activeIds,
          single,
          personId,
        ),
      );
    } catch (matchingError) {
      setError(
        matchingError instanceof Error
          ? matchingError.message
          : t('Could not start matching.'),
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <section
      style={{
        padding: 'var(--t-spacing-4)',
        display: 'grid',
        gap: 'var(--t-spacing-3)',
        fontSize: 13,
      }}
    >
      <div style={ROW_STYLE}>
        <label>
          {t('Person')}{' '}
          <select
            style={CONTROL_STYLE}
            value={personId}
            disabled={busy}
            onChange={(event) => {
              setRunId(null);
              void loadPerson(event.target.value);
            }}
          >
            <option value="">{t('Select a Person')}</option>
            {people.map(({ id, name, emails }) => (
              <option key={id} value={id}>
                {[name.firstName, name.lastName, emails?.primaryEmail]
                  .filter(Boolean)
                  .join(' · ') || id}
              </option>
            ))}
          </select>
        </label>
        {recordIds && (
          <button
            type="button"
            style={CONTROL_STYLE}
            disabled={busy || !personId}
            onClick={() => void loadPerson(personId)}
          >
            {t('Refresh results')}
          </button>
        )}
      </div>
      {!loadingPerson && !personId && (
        <p>{t('Select a Person to view results or run CV matching.')}</p>
      )}
      {!busy && !error && personId && !hasMasterCv && (
        <p role="status">
          {t('This Person needs a master CV before matching.')}
        </p>
      )}
      {!recordIds && (
        <div style={ROW_STYLE}>
          <label>
            {t('Jobs')}{' '}
            <select
              aria-label={t('Jobs to load')}
              disabled={busy}
              value={filtered ? 'filtered' : 'all'}
              style={CONTROL_STYLE}
              onChange={(event) => {
                setFiltered(event.target.value === 'filtered');
                setJobs([]);
                setSelectedIds([]);
                setLoaded(false);
                setRunId(null);
              }}
            >
              <option value="filtered">
                {t('TypeScript · Remote · Over $100k')}
              </option>
              <option value="all">{t('All Job Positions')}</option>
            </select>
          </label>
          <button
            type="button"
            style={CONTROL_STYLE}
            disabled={busy}
            onClick={loadJobs}
          >
            {loading ? t('Loading…') : t('Load / refresh jobs')}
          </button>
          <input
            aria-label={t('Search loaded jobs')}
            placeholder={t('Search loaded jobs')}
            style={CONTROL_STYLE}
            value={search}
            disabled={busy}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedIds([]);
            }}
          />
        </div>
      )}
      {!recordIds && filtered && (
        <p style={{ margin: 0, color: 'var(--t-font-color-secondary)' }}>
          {t(
            'Mentions TypeScript; location is empty or contains Remote; minimum annual USD salary is over $100,000.',
          )}
        </p>
      )}
      <div style={ROW_STYLE}>
        <button
          type="button"
          style={{
            ...CONTROL_STYLE,
            opacity: busy || !hasMasterCv || activeIds.length !== 1 ? 0.5 : 1,
          }}
          disabled={busy || !hasMasterCv || activeIds.length !== 1}
          onClick={() => matchJobs(true)}
        >
          {t('Match this job')}
        </button>
        <button
          type="button"
          style={{
            ...CONTROL_STYLE,
            opacity: busy || !hasMasterCv || activeIds.length === 0 ? 0.5 : 1,
          }}
          disabled={busy || !hasMasterCv || activeIds.length === 0}
          onClick={() => matchJobs(false)}
        >
          {t('Match selected jobs')}
        </button>
        <span>
          {t('Selected')} · {activeIds.length}
        </span>
      </div>
      {error && (
        <p
          role="alert"
          style={{ margin: 0, color: 'var(--t-font-color-danger)' }}
        >
          {error}
        </p>
      )}
      {runId && (
        <div role="status" style={ROW_STYLE}>
          <span>
            {runStatus === 'FAILED'
              ? t('Matching run failed.')
              : runStatus === 'COMPLETED'
                ? t(
                    'Matching run completed. Open the run for posting-level results.',
                  )
                : runStatus === 'STOPPED'
                  ? t('Matching run stopped.')
                  : t('Matching pending.')}
          </span>
          <button
            type="button"
            style={CONTROL_STYLE}
            onClick={() =>
              navigate(AppPath.RecordShowPage, {
                objectNameSingular: 'workflowRun',
                objectRecordId: runId,
              })
            }
          >
            {t('Open run')}
          </button>
        </div>
      )}
      <p style={{ margin: 0, color: 'var(--t-font-color-secondary)' }}>
        {t(
          'Bulk matching processes up to the configured batch size (25 by default). Repeat with the same selection for the remainder. Jobs without linked descriptions are reported in the run.',
        )}
      </p>
      {loaded && (
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {!recordIds && (
                  <th style={CELL_STYLE}>
                    <input
                      type="checkbox"
                      aria-label={t('Select all visible jobs')}
                      disabled={busy || visibleJobs.length === 0}
                      checked={
                        visibleJobs.length > 0 &&
                        visibleJobs.every((job) => selectedIds.includes(job.id))
                      }
                      onChange={(event) =>
                        setSelectedIds(
                          event.target.checked
                            ? visibleJobs.map((job) => job.id)
                            : [],
                        )
                      }
                    />
                  </th>
                )}
                {[
                  t('Job'),
                  t('Company'),
                  t('Location'),
                  t('Minimum USD'),
                  t('Fit score'),
                ].map((label) => (
                  <th key={label} style={CELL_STYLE}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleJobs.map((job) => {
                const assessment = assessments.get(job.id);
                const others = otherAssessments.get(job.id);
                return (
                  <tr key={job.id}>
                    {!recordIds && (
                      <td style={CELL_STYLE}>
                        <input
                          type="checkbox"
                          aria-label={`${t('Select')} ${job.name}`}
                          checked={selectedIds.includes(job.id)}
                          disabled={busy}
                          onChange={(event) =>
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, job.id]
                                : current.filter((id) => id !== job.id),
                            )
                          }
                        />
                      </td>
                    )}
                    <td style={CELL_STYLE}>{job.name}</td>
                    <td style={CELL_STYLE}>{job.company?.name ?? ''}</td>
                    <td style={CELL_STYLE}>{job.location ?? ''}</td>
                    <td style={CELL_STYLE}>
                      {job.salaryMinimumUsd?.toLocaleString() ?? ''}
                    </td>
                    <td style={CELL_STYLE}>
                      {assessment ? (
                        <AssessmentReport
                          key={assessment.id}
                          assessment={assessment}
                        />
                      ) : (
                        t('Awaiting assessment')
                      )}
                      {others?.length ? (
                        <details>
                          <summary>{t('Other assessments')}</summary>
                          {others.map((item) => (
                            <AssessmentReport
                              key={item.id}
                              assessment={item}
                              showPosting
                            />
                          ))}
                        </details>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleJobs.length === 0 && (
            <p>{t('No jobs match the current search.')}</p>
          )}
        </div>
      )}
    </section>
  );
};

export const ProfileMatchingDashboard = () => <ProfileMatching />;

export const profileMatchingFrontComponent = defineFrontComponent({
  universalIdentifier: IDENTIFIERS.DASHBOARD_MATCHING_COMPONENT,
  name: 'Job profile matching',
  description: 'Select Job Positions and run CV matching from a dashboard.',
  component: ProfileMatchingDashboard,
  widgetAvailability: { pageLayoutType: PageLayoutType.DASHBOARD },
});
