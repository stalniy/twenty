import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const model = process.argv[2];
if (!model || !/^[a-zA-Z0-9._:/-]+$/.test(model)) {
  throw new Error('Usage: yarn configure <available-account-model>');
}
const secret = randomBytes(32).toString('hex');
const directory = fileURLToPath(new URL('../', import.meta.url));
const providers = {
  'local-codex': {
    npm: '@ai-sdk/openai-compatible',
    label: 'Local Codex (ChatGPT plan)',
    apiKey: secret,
    baseUrl: 'http://research-ai:8787/v1',
    models: [
      {
        name: model,
        label: 'Local Codex (ChatGPT plan)',
        contextWindowTokens: 32000,
        maxOutputTokens: 4096,
        inputCostPerMillionTokens: 0,
        outputCostPerMillionTokens: 0,
      },
    ],
  },
};
// Exclusive creation prevents silently rotating an existing bridge connection.
await writeFile(
  `${directory}.env`,
  `RESEARCH_AI_PROVIDER=codex\nRESEARCH_AI_MODEL=${model}\nRESEARCH_AI_SECRET=${secret}\n`,
  { mode: 0o600, flag: 'wx' },
);
await writeFile(
  `${directory}.env.twenty`,
  `AI_PROVIDERS='${JSON.stringify(providers)}'\n`,
  { mode: 0o600, flag: 'wx' },
);
console.log(
  'Created protected .env and .env.twenty files. No Codex credentials were accessed.',
);
