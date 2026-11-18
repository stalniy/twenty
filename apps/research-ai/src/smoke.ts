import { spawn } from 'node:child_process';

import { readConfiguration } from './config.ts';

const configuration = readConfiguration();
const script = `
const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');
const { streamText, tool, jsonSchema, stepCountIs } = require('ai');
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', async () => {
  try {
    const configuration = JSON.parse(input);
    const provider = createOpenAICompatible({ name: 'local-codex', baseURL: configuration.baseUrl, apiKey: configuration.secret });
    const result = streamText({
      model: provider(configuration.model),
      prompt: 'Call lookup with key smoke. After the tool returns, reply exactly with its returned value.',
      tools: { lookup: tool({ description: 'Return the smoke test value', inputSchema: jsonSchema({ type: 'object', properties: { key: { type: 'string' } }, required: ['key'], additionalProperties: false }), execute: async () => ({ value: 'TWENTY_CODEX_OK' }) }) },
      stopWhen: stepCountIs(2),
      maxRetries: 0,
    });
    let text = '';
    for await (const part of result.textStream) text += part;
    const steps = await result.steps;
    if (!text.includes('TWENTY_CODEX_OK') || !steps.some(step => step.toolCalls.length > 0)) throw new Error('Tool round trip did not complete');
    console.log(JSON.stringify({ sdk: 'Twenty installed AI SDK', toolRoundTrip: true, text }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
});
`;
const child = spawn(
  'docker',
  ['exec', '-i', 'twenty-server-1', 'node', '-e', script],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
child.stdin.end(
  JSON.stringify({
    model: configuration.RESEARCH_AI_MODEL,
    secret: configuration.RESEARCH_AI_SECRET,
    baseUrl: process.env.RESEARCH_AI_BASE_URL ?? 'http://research-ai:8787/v1',
  }),
);
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
