import { beforeEach, expect, it, vi } from 'vitest';

import { runJobCollection } from '../collect-jobs.function';

const mocks = vi.hoisted(() => ({
  resolvePerson: vi.fn(),
  readTargetRole: vi.fn(),
  seedBoards: vi.fn(),
  collectJobs: vi.fn(),
}));

vi.mock('../../twenty-client/create-collection-repository', () => ({
  createCollectionRepository: () => ({
    resolvePerson: mocks.resolvePerson,
    readTargetRole: mocks.readTargetRole,
    seedBoards: mocks.seedBoards,
    repository: {},
  }),
}));
vi.mock('../../services/collect-jobs.service', () => ({
  collectJobs: mocks.collectJobs,
}));

const PERSON_ID = 'af7b810d-3eea-462e-88e6-bb31321ec230';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.resolvePerson.mockResolvedValue({ id: PERSON_ID });
  mocks.readTargetRole.mockResolvedValue('Staff Fullstack Software Engineer');
  mocks.collectJobs.mockResolvedValue({ matched: 0 });
});

it('uses the explicitly assigned Person and reads the Target role once', async () => {
  await runJobCollection({ personId: PERSON_ID });
  expect(mocks.resolvePerson).toHaveBeenCalledWith(PERSON_ID);
  expect(mocks.readTargetRole).toHaveBeenCalledExactlyOnceWith(PERSON_ID);
  expect(mocks.collectJobs).toHaveBeenCalledWith(
    expect.objectContaining({
      filters: expect.objectContaining({
        targetRole: 'Staff Fullstack Software Engineer',
      }),
    }),
  );
});

it('resolves the default Person and stops before preparing boards when the Target role is missing', async () => {
  mocks.readTargetRole.mockRejectedValue(
    new Error(
      'Set the assigned Person’s master CV Target role before collecting jobs.',
    ),
  );
  await expect(runJobCollection({})).rejects.toThrow('Target role');
  expect(mocks.resolvePerson).toHaveBeenCalledWith(undefined);
  expect(mocks.seedBoards).not.toHaveBeenCalled();
  expect(mocks.collectJobs).not.toHaveBeenCalled();
});
