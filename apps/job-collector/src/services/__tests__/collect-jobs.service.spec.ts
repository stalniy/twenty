import { describe, expect, it, vi } from 'vitest';
import { type CollectionRepository } from '../../types/collection-repository';
import { type JobPosition } from '../../types/job-position';
import { type SourcePosting } from '../../types/source-posting';
import { collectJobs } from '../collect-jobs.service';
import { BOARD, createJob } from './fixtures';

const setup = () => {
  const positions: JobPosition[] = [];
  const postings: SourcePosting[] = [];
  const repository: CollectionRepository = {
    listBoards: async () => [BOARD],
    listPositions: async () => positions,
    listPostings: async () => postings,
    createPosition: vi.fn(async (board, job, _salary, id) => {
      const position = {
        id,
        companyId: board.companyId,
        location: job.location || null,
        joburl: { primaryLinkUrl: job.sourceUrl },
      };
      positions.push(position);
      return position;
    }),
    updatePositionLocation: vi.fn(async () => undefined),
    savePosting: vi.fn(async (_board, job, _salary, jobPositionId) => {
      const id = `${job.provider}:${job.externalId}`;
      if (!postings.some((posting) => posting.id === id))
        postings.push({
          id,
          provider: job.provider,
          externalId: job.externalId,
          jobPositionId,
        });
    }),
    saveBoardResult: vi.fn(async () => undefined),
  };
  const connectors = {
    ASHBY: vi.fn(async () => [createJob()]),
    LEVER: vi.fn(async () => [createJob()]),
    WORK_AT_A_STARTUP: vi.fn(async () => [createJob()]),
    ELASTIC: vi.fn(async () => [createJob()]),
    FYUL: vi.fn(async () => [createJob()]),
    THE_AA: vi.fn(async () => [createJob()]),
  };
  const options = {
    repository,
    connectors,
    filters: { targetRole: 'Software Engineer', keywords: ['TypeScript'] },
  };
  return { positions, postings, repository, options };
};

describe('collection', () => {
  it('creates once and links the same position on subsequent runs', async () => {
    const state = setup();
    expect((await collectJobs(state.options)).created).toBe(1);
    expect((await collectJobs(state.options)).created).toBe(0);
    expect(state.positions).toHaveLength(1);
    expect(state.postings).toHaveLength(1);
  });
  it('links an existing position and synchronizes only its location', async () => {
    const state = setup();
    state.positions.push({
      id: 'existing-position',
      companyId: BOARD.companyId,
      location: null,
      joburl: {
        primaryLinkUrl: createJob().sourceUrl + '?utm_source=old-import',
      },
    });
    expect((await collectJobs(state.options)).linkedExisting).toBe(1);
    expect(state.repository.createPosition).not.toHaveBeenCalled();
    expect(state.postings[0].jobPositionId).toBe('existing-position');
    expect(state.repository.updatePositionLocation).toHaveBeenCalledWith(
      'existing-position',
      'Europe',
    );
    await collectJobs(state.options);
    expect(state.repository.updatePositionLocation).toHaveBeenCalledTimes(1);
  });
  it('keeps the existing location when the source has no location', async () => {
    const state = setup();
    state.positions.push({
      id: 'existing-position',
      companyId: BOARD.companyId,
      location: 'Europe',
      joburl: { primaryLinkUrl: createJob().sourceUrl },
    });
    state.options.connectors.ASHBY.mockResolvedValue([
      createJob({ location: '' }),
    ]);
    await collectJobs(state.options);
    expect(state.repository.updatePositionLocation).not.toHaveBeenCalled();
  });
  it('normalizes new position locations and preserves the source location', async () => {
    const state = setup();
    state.options.connectors.ASHBY.mockResolvedValue([
      createJob({ location: 'Remote (USA)' }),
    ]);
    await collectJobs(state.options);
    expect(state.positions[0].location).toBe('United States');
    expect(state.repository.savePosting).toHaveBeenCalledWith(
      BOARD,
      expect.objectContaining({ location: 'Remote (USA)' }),
      expect.anything(),
      state.positions[0].id,
      expect.any(String),
    );
  });
  it('normalizes existing positions when their jobs are collected again', async () => {
    const state = setup();
    state.positions.push({
      id: 'existing-position',
      companyId: BOARD.companyId,
      location: 'USA',
      joburl: { primaryLinkUrl: createJob().sourceUrl },
    });
    state.options.connectors.ASHBY.mockResolvedValue([
      createJob({ location: 'United States of America' }),
    ]);
    await collectJobs(state.options);
    expect(state.repository.updatePositionLocation).toHaveBeenCalledWith(
      'existing-position',
      'United States',
    );
  });
  it('does not replace a known location with a placeholder', async () => {
    const state = setup();
    state.positions.push({
      id: 'existing-position',
      companyId: BOARD.companyId,
      location: 'Europe',
      joburl: { primaryLinkUrl: createJob().sourceUrl },
    });
    state.options.connectors.ASHBY.mockResolvedValue([
      createJob({ location: 'not set' }),
    ]);
    await collectJobs(state.options);
    expect(state.repository.updatePositionLocation).not.toHaveBeenCalled();
  });
  it('deduplicates sources that share an application URL', async () => {
    const state = setup();
    state.options.connectors.ASHBY.mockResolvedValue([
      createJob(),
      createJob({
        provider: 'LEVER',
        externalId: 'mirror',
        sourceUrl: 'https://jobs.lever.co/example/mirror',
        applyUrl: createJob().applyUrl,
      }),
    ]);
    await collectJobs(state.options);
    expect(state.positions).toHaveLength(1);
    expect(state.postings).toHaveLength(2);
  });
  it('keeps distinct openings with identical titles separate', async () => {
    const state = setup();
    state.options.connectors.ASHBY.mockResolvedValue([
      createJob(),
      createJob({
        externalId: 'job-2',
        sourceUrl: 'https://jobs.ashbyhq.com/example/job-2',
        applyUrl: 'https://jobs.ashbyhq.com/example/job-2/apply',
      }),
    ]);
    await collectJobs(state.options);
    expect(state.positions).toHaveLength(2);
  });
  it('skips hybrid and jobs without TypeScript', async () => {
    const state = setup();
    state.options.connectors.ASHBY.mockResolvedValue([
      createJob({ workplaceType: 'HYBRID' }),
      createJob({ description: 'Python' }),
    ]);
    expect((await collectJobs(state.options)).matched).toBe(0);
    expect(state.repository.savePosting).not.toHaveBeenCalled();
  });
  it('continues after one board fails and records that failure', async () => {
    const state = setup();
    state.repository.listBoards = async () => [
      BOARD,
      { ...BOARD, id: 'second-board', provider: 'LEVER' },
    ];
    state.options.connectors.ASHBY.mockRejectedValue(new Error('HTTP 404'));
    const summary = await collectJobs(state.options);
    expect(summary).toMatchObject({
      succeeded: 1,
      created: 1,
      errors: [{ boardId: BOARD.id, message: 'HTTP 404' }],
    });
    expect(state.repository.saveBoardResult).toHaveBeenCalledTimes(2);
  });
  it('fails visibly if every board fails', async () => {
    const state = setup();
    state.options.connectors.ASHBY.mockRejectedValue(
      new Error('network unavailable'),
    );
    await expect(collectJobs(state.options)).rejects.toThrow(
      'All job boards failed',
    );
  });
  it('does not reuse a link to a deleted position', async () => {
    const state = setup();
    state.postings.push({
      id: 'posting',
      provider: 'ASHBY',
      externalId: 'job-1',
      jobPositionId: 'deleted',
    });
    expect((await collectJobs(state.options)).created).toBe(1);
  });
  it('continues when saving one board result fails', async () => {
    const state = setup();
    state.repository.listBoards = async () => [
      BOARD,
      { ...BOARD, id: 'second-board', provider: 'LEVER' },
    ];
    state.repository.saveBoardResult = vi
      .fn()
      .mockRejectedValueOnce(new Error('write failed'))
      .mockResolvedValue(undefined);
    const summary = await collectJobs(state.options);
    expect(summary.succeeded).toBe(2);
    expect(summary.errors[0].message).toContain('Could not save board result');
  });
});
