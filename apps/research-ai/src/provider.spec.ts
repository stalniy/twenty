import { afterEach, describe, expect, it, vi } from 'vitest';

import { codexEnvironment, classifyCodexFailure } from './codex.ts';
import { readConfiguration } from './config.ts';
import { type ChatRequest } from './contracts.ts';
import {
  createChatProvider,
  createResearchAIProvider,
  validateCompletion,
} from './provider.ts';

const CONFIGURATION = readConfiguration({
  RESEARCH_AI_SECRET: 'test-secret-with-at-least-32-characters',
  RESEARCH_AI_MODEL: 'configured-model',
});
const REQUEST: ChatRequest = {
  model: 'configured-model',
  messages: [{ role: 'user', content: 'Hello' }],
};

afterEach(() => vi.unstubAllGlobals());

describe('research and chat providers', () => {
  it('keeps API and bridge secrets out of Codex processes', () => {
    expect(
      codexEnvironment({
        HOME: '/test',
        PATH: '/bin',
        CODEX_HOME: '/codex',
        OPENAI_API_KEY: 'secret',
        CODEX_API_KEY: 'secret',
        RESEARCH_AI_SECRET: 'secret',
        DATABASE_URL: 'secret',
      }),
    ).toEqual({ HOME: '/test', PATH: '/bin', CODEX_HOME: '/codex' });
  });

  it.each([
    'refresh token expired',
    '401 Unauthorized',
    'Please run codex login',
  ])('requires reauthentication for %s', (message) => {
    expect(classifyCodexFailure(message).code).toBe('authentication_required');
  });

  it('reports subscription limits without attempting another provider', () => {
    expect(classifyCodexFailure('Usage limit reached')).toMatchObject({
      status: 429,
      code: 'usage_limit',
    });
  });

  it('rejects calls to tools outside the supplied tools', () => {
    expect(() =>
      validateCompletion(REQUEST, {
        content: '',
        toolCalls: [{ name: 'deleteAll', arguments: '{}' }],
      }),
    ).toThrow('disallowed tool');
  });

  it('validates tool arguments and preserves valid calls for Twenty to execute', () => {
    const request: ChatRequest = {
      ...REQUEST,
      tools: [
        {
          type: 'function',
          function: {
            name: 'lookup',
            parameters: {
              type: 'object',
              properties: { id: { type: 'string' } },
              required: ['id'],
              additionalProperties: false,
            },
          },
        },
      ],
    };
    expect(() =>
      validateCompletion(request, {
        content: '',
        toolCalls: [{ name: 'lookup', arguments: '{"id":12}' }],
      }),
    ).toThrow('invalid tool arguments');
    expect(
      validateCompletion(request, {
        content: '',
        toolCalls: [{ name: 'lookup', arguments: '{"id":"company"}' }],
      }).toolCalls[0].name,
    ).toBe('lookup');
  });

  it('rejects malformed structured output', () => {
    expect(() =>
      validateCompletion(
        {
          ...REQUEST,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'result',
              schema: { type: 'object', required: ['answer'] },
            },
          },
        },
        { content: '{}', toolCalls: [] },
      ),
    ).toThrow('does not match');
  });

  it('rejects invented citations in research assessments', async () => {
    const provider = createResearchAIProvider(
      {
        complete: async () => ({
          content: JSON.stringify({
            summary: 'Claim',
            confidence: 'low',
            findings: [{ claim: 'Claim', evidenceIds: ['invented'] }],
            unknowns: [],
          }),
          toolCalls: [],
        }),
      },
      'configured-model',
    );
    await expect(
      provider.analyze([{ id: 'source', text: 'Evidence' }], 'Context'),
    ).rejects.toMatchObject({ code: 'invalid_citation' });
  });

  it('uses the configured OpenAI model and clamps billable output tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ finish_reason: 'stop', message: { content: 'Hello' } }],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const provider = createChatProvider({
      ...CONFIGURATION,
      RESEARCH_AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'server-secret',
      RESEARCH_AI_MAX_OUTPUT_TOKENS: 100,
    });
    expect(await provider.complete({ ...REQUEST, max_tokens: 1000 })).toEqual({
      content: 'Hello',
      toolCalls: [],
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      model: 'configured-model',
      max_completion_tokens: 100,
      store: false,
      stream: false,
    });
  });

  it.each([401, 429, 500])(
    'sanitizes OpenAI HTTP %s without retrying',
    async (status) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          new Response('sensitive upstream diagnostics', { status }),
        );
      vi.stubGlobal('fetch', fetchMock);
      const provider = createChatProvider({
        ...CONFIGURATION,
        RESEARCH_AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'secret',
      });
      await expect(provider.complete(REQUEST)).rejects.toThrow(
        /Check|quota|failed/,
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects truncated OpenAI output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ finish_reason: 'length', message: { content: '{}' } }],
          }),
        ),
      ),
    );
    await expect(
      createChatProvider({
        ...CONFIGURATION,
        RESEARCH_AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'secret',
      }).complete(REQUEST),
    ).rejects.toMatchObject({ code: 'incomplete_output' });
  });
});
