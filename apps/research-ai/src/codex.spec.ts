import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createCodexProvider } from './codex.ts';
import { readConfiguration } from './config.ts';

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'twenty-codex-test-'));
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

it('supplies the installed skill to the actual Codex subprocess', async () => {
  vi.stubEnv('CODEX_HOME', directory);
  const skillDirectory = join(directory, 'skills/jd-matching');
  await mkdir(skillDirectory, { recursive: true });
  await writeFile(
    join(skillDirectory, 'SKILL.md'),
    '---\nname: jd-matching\n---\nCompare every requirement with resume evidence.',
  );
  const provider = await fakeCodex(`
    const fs = require('node:fs');
    const args = process.argv.slice(2);
    let prompt = '';
    process.stdin.on('data', chunk => prompt += chunk);
    process.stdin.on('end', () => {
      if (!prompt.includes('Compare every requirement with resume evidence.')) process.exit(2);
      fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], JSON.stringify({content: 'skill assessment', toolCalls: []}));
    });
  `);
  expect(
    await provider.complete({
      ...REQUEST,
      messages: [
        { role: 'system', content: 'Use $jd-matching.' },
        ...REQUEST.messages,
      ],
    }),
  ).toEqual({ content: 'skill assessment', toolCalls: [] });
});

const fakeCodex = async (script: string, timeout = 2000) => {
  const binary = join(directory, 'codex');
  await writeFile(binary, `#!${process.execPath}\n${script}`);
  await chmod(binary, 0o700);
  return createCodexProvider(
    readConfiguration({
      CODEX_BINARY: binary,
      RESEARCH_AI_TIMEOUT_MS: String(timeout),
      RESEARCH_AI_SECRET: 'test-secret-with-at-least-32-characters',
      RESEARCH_AI_MODEL: 'configured-model',
    }),
  );
};
const REQUEST = {
  model: 'configured-model',
  messages: [{ role: 'user' as const, content: 'Hello' }],
};

it('passes stdin and structured-output flags, then cleans temporary files', async () => {
  const marker = join(directory, 'cwd');
  const provider = await fakeCodex(`
    const fs = require('node:fs');
    const args = process.argv.slice(2);
    if (!args.includes('never') || !args.includes('read-only') || !args.includes('--ignore-user-config') || !args.includes('forced_login_method="chatgpt"') || process.env.OPENAI_API_KEY || process.env.RESEARCH_AI_SECRET) process.exit(1);
    fs.writeFileSync(${JSON.stringify(marker)}, process.cwd());
    let prompt = '';
    process.stdin.on('data', chunk => prompt += chunk);
    process.stdin.on('end', () => {
      if (!prompt.includes('Hello')) process.exit(2);
      fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], JSON.stringify({content: 'hello', toolCalls: []}));
    });
  `);
  expect(await provider.complete(REQUEST)).toEqual({
    content: 'hello',
    toolCalls: [],
  });
  await expect(readFile(await readFile(marker, 'utf8'))).rejects.toMatchObject({
    code: 'ENOENT',
  });
});

it('terminates timed-out Codex jobs', async () => {
  const provider = await fakeCodex('setInterval(() => {}, 1000);', 100);
  await expect(provider.complete(REQUEST)).rejects.toMatchObject({
    code: 'timeout',
    status: 504,
  });
});

it('sanitizes CLI authentication diagnostics', async () => {
  const provider = await fakeCodex(
    'console.error("refresh token expired: sensitive diagnostic"); process.exit(1);',
  );
  await expect(provider.complete(REQUEST)).rejects.toMatchObject({
    code: 'authentication_required',
    message: 'Run codex login as the worker user, then retry.',
  });
});
