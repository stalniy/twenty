import { once } from 'node:events';
import { type AddressInfo } from 'node:net';

import { afterEach, beforeEach, expect, it } from 'vitest';

import { readConfiguration } from './config.ts';
import { createBridge } from './server.ts';

const CONFIGURATION = readConfiguration({
  RESEARCH_AI_SECRET: 'test-secret-with-at-least-32-characters',
  RESEARCH_AI_MODEL: 'configured-model',
});
let receivedMessages: unknown;
const SERVER = createBridge(CONFIGURATION, {
  complete: async (request) => {
    receivedMessages = request.messages;
    return { content: 'Hello from Codex', toolCalls: [] };
  },
});
let baseURL: string;

beforeEach(async () => {
  SERVER.listen(0, '127.0.0.1');
  await once(SERVER, 'listening');
  baseURL = `http://127.0.0.1:${(SERVER.address() as AddressInfo).port}`;
});
afterEach(async () => {
  SERVER.closeAllConnections();
  await new Promise<void>((resolve) => SERVER.close(() => resolve()));
});

const send = (body: unknown) =>
  fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CONFIGURATION.RESEARCH_AI_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

it('requires the bridge secret even for model discovery', async () => {
  expect((await fetch(`${baseURL}/v1/models`)).status).toBe(401);
});

it('returns SSE compatible with the chat completions protocol and preserves tool results', async () => {
  const messages = [
    {
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: 'call_1',
          type: 'function',
          function: { name: 'lookup', arguments: '{}' },
        },
      ],
    },
    { role: 'tool', tool_call_id: 'call_1', content: '{"company":"Twenty"}' },
  ];
  const response = await send({
    model: 'configured-model',
    messages,
    stream: true,
  });
  expect(response.headers.get('content-type')).toBe('text/event-stream');
  const stream = await response.text();
  expect(stream).toContain('Hello from Codex');
  expect(stream).toContain('"finish_reason":"stop"');
  expect(stream).toContain('data: [DONE]');
  expect(receivedMessages).toEqual(messages);
});

it('rejects unsupported images instead of silently ignoring them', async () => {
  const response = await send({
    model: 'configured-model',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: 'https://example.com/image.png' },
          },
        ],
      },
    ],
  });
  expect(response.status).toBe(400);
});

it('bounds incoming request bodies', async () => {
  const response = await send({
    model: 'configured-model',
    messages: [
      {
        role: 'user',
        content: 'x'.repeat(CONFIGURATION.RESEARCH_AI_MAX_INPUT_BYTES),
      },
    ],
  });
  expect(response.status).toBe(413);
});
