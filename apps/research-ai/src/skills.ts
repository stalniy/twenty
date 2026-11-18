import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { type ChatRequest, ProviderError } from './contracts.ts';

export const loadRequestedSkills = async (request: ChatRequest) => {
  const requested = request.messages.some((message) => {
    if (message.role !== 'system' && message.role !== 'developer') return false;
    const content = message.content;
    const text = Array.isArray(content)
      ? content.map((part) => part.text).join('\n')
      : (content ?? '');
    return /^Use \$jd-matching\.$/m.test(text);
  });
  if (!requested) return '';

  const path = join(
    process.env.CODEX_HOME || join(homedir(), '.codex'),
    'skills/jd-matching/SKILL.md',
  );
  try {
    const skill = await readFile(path, 'utf8');
    if (!/^name: jd-matching\s*$/m.test(skill))
      throw new Error('Invalid skill');
    return `Apply the following installed skill to this request. The response schema adapts its output for Twenty.\n<skill name="jd-matching">\n${skill}\n</skill>`;
  } catch {
    throw new ProviderError(
      503,
      'skill_unavailable',
      'Install the jd-matching skill in CODEX_HOME/skills/jd-matching/SKILL.md for the bridge user, then retry.',
    );
  }
};
