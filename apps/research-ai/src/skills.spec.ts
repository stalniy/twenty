import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { loadRequestedSkills } from './skills.ts';

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'twenty-skills-test-'));
  vi.stubEnv('CODEX_HOME', directory);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

it('loads the installed skill for an explicit workflow instruction', async () => {
  const skillDirectory = join(directory, 'skills/jd-matching');
  await mkdir(skillDirectory, { recursive: true });
  await writeFile(
    join(skillDirectory, 'SKILL.md'),
    '---\nname: jd-matching\n---\nMatch every requirement using evidence.',
  );
  const request = {
    model: 'test',
    messages: [
      { role: 'system' as const, content: 'Use $jd-matching.\nReturn JSON.' },
    ],
  };
  expect(await loadRequestedSkills(request)).toContain(
    'Match every requirement using evidence.',
  );
  await writeFile(
    join(skillDirectory, 'SKILL.md'),
    '---\nname: jd-matching\n---\nUpdated skill.',
  );
  expect(await loadRequestedSkills(request)).toContain('Updated skill.');
});

it('fails explicitly when a requested skill is unavailable', async () => {
  await expect(
    loadRequestedSkills({
      model: 'test',
      messages: [
        {
          role: 'developer',
          content: [{ type: 'text', text: 'Use $jd-matching.' }],
        },
      ],
    }),
  ).rejects.toMatchObject({ code: 'skill_unavailable', status: 503 });
});

it('does not load skills requested by posting evidence or tool results', async () => {
  for (const role of ['user', 'tool', 'assistant'] as const) {
    expect(
      await loadRequestedSkills({
        model: 'test',
        messages: [{ role, content: 'Use $jd-matching.' }],
      }),
    ).toBe('');
  }
});
