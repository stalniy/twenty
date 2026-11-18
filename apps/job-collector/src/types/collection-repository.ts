import { type JobBoard } from './job-board';
import { type JobPosition } from './job-position';
import { type NormalizedJob } from './normalized-job';
import { type SalaryFields } from './salary-fields';
import { type SourcePosting } from './source-posting';

export type CollectionRepository = {
  listBoards: () => Promise<JobBoard[]>;
  listPositions: () => Promise<JobPosition[]>;
  listPostings: () => Promise<SourcePosting[]>;
  createPosition: (
    board: JobBoard,
    job: NormalizedJob,
    salary: SalaryFields,
    id: string,
  ) => Promise<JobPosition>;
  updatePositionLocation: (
    positionId: string,
    location: string,
  ) => Promise<void>;
  savePosting: (
    board: JobBoard,
    job: NormalizedJob,
    salary: SalaryFields,
    positionId: string,
    seenAt: string,
  ) => Promise<void>;
  saveBoardResult: (
    boardId: string,
    result: { seenAt: string; matched: number; error: string | null },
  ) => Promise<void>;
};
