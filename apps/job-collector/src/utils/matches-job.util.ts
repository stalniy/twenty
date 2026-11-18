import { type JobFilters } from '../types/job-filters';
import { type NormalizedJob } from '../types/normalized-job';

const SENIORITY = [
  'intern',
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
  'lead',
];

const roleWords = (title: string): string[] =>
  title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\bfull[\s\p{Pd}]*stack\b/gu, 'fullstack')
    .replace(/\b(?:sr|snr)\b/g, 'senior')
    .replace(/\bjr\b/g, 'junior')
    .match(/[\p{L}\p{N}+#]+/gu) ?? [];

const matchesTargetRole = (title: string, target: string) => {
  const targetWords = roleWords(target);
  const advertisedWords = roleWords(title);
  const fullStackSoftware =
    targetWords.includes('fullstack') &&
    targetWords.some((word) => word === 'engineer' || word === 'developer');
  const requiredWords = targetWords.filter(
    (word) =>
      !SENIORITY.includes(word) && !(fullStackSoftware && word === 'software'),
  );
  if (!requiredWords.length) return false;
  return (
    targetWords
      .filter((word) => SENIORITY.includes(word))
      .every(
        (word) =>
          advertisedWords.includes(word) ||
          (word === 'staff' && advertisedWords.includes('senior')),
      ) &&
    requiredWords.every(
      (word) =>
        advertisedWords.includes(word) ||
        (fullStackSoftware &&
          (word === 'engineer' || word === 'developer') &&
          advertisedWords.some(
            (value) => value === 'engineer' || value === 'developer',
          )),
    )
  );
};

export const matchesJob = (
  job: NormalizedJob,
  filters: JobFilters,
): boolean => {
  const description = `${job.title} ${job.description}`;

  return (
    job.workplaceType === 'REMOTE' &&
    matchesTargetRole(job.title, filters.targetRole) &&
    filters.keywords.some((keyword) => {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(
        `(?<![\\p{L}\\p{N}_])${escapedKeyword}(?![\\p{L}\\p{N}_])`,
        'iu',
      ).test(description);
    })
  );
};
