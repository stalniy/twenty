import { afterEach, expect, it, vi } from 'vitest';
import { collectionSettings } from '../collection-settings.util';

afterEach(() => vi.unstubAllEnvs());

it('defaults the keyword to TypeScript independently of the old title setting', () => {
  vi.stubEnv('JOB_TITLE', 'Engineer');
  vi.stubEnv('JOB_KEYWORD', ',;\n ');
  expect(collectionSettings()).toEqual({
    keywords: ['TypeScript'],
    legacySlugField: 'ashbyhqSlug',
  });
});

it('accepts multiple keywords', () => {
  vi.stubEnv('JOB_KEYWORD', ' TypeScript;React\nNode.js,TypeScript ');
  expect(collectionSettings().keywords).toEqual([
    'TypeScript',
    'React',
    'Node.js',
  ]);
});

it('rejects a malformed company-field binding', () => {
  vi.stubEnv('ASHBY_COMPANY_SLUG_FIELD', 'id } } mutation {');
  expect(() => collectionSettings()).toThrow('GraphQL field name');
});
