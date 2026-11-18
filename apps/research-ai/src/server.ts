import { timingSafeEqual, randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { z } from 'zod';

import { type Configuration } from './config.ts';
import {
  chatRequestSchema,
  ProviderError,
  type ChatProvider,
  type ChatRequest,
  type Completion,
} from './contracts.ts';

export const readBody = async (
  request: NodeJS.ReadableStream,
  limit: number,
): Promise<string> => {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > limit)
      throw new ProviderError(
        413,
        'input_limit',
        'Request size limit exceeded.',
      );
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
};

const sendJSON = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
};

const authorized = (request: IncomingMessage, secret: string) => {
  const actual = Buffer.from(request.headers.authorization ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const completionMessage = (completion: Completion) => ({
  role: 'assistant',
  content: completion.content || null,
  ...(completion.toolCalls.length > 0 && {
    tool_calls: completion.toolCalls.map((call) => ({
      id: `call_${randomUUID()}`,
      type: 'function',
      function: call,
    })),
  }),
});

export const createBridge = (
  configuration: Configuration,
  provider: ChatProvider,
) => {
  let busy = false;
  const server = createServer(async (request, response) => {
    if (!authorized(request, configuration.RESEARCH_AI_SECRET)) {
      sendJSON(response, 401, {
        error: { code: 'unauthorized', message: 'Invalid bridge credential.' },
      });
      return;
    }
    if (request.method === 'GET' && request.url === '/v1/models') {
      sendJSON(response, 200, {
        object: 'list',
        data: [
          {
            id: configuration.RESEARCH_AI_MODEL,
            object: 'model',
            owned_by: configuration.RESEARCH_AI_PROVIDER,
          },
        ],
      });
      return;
    }
    if (request.method !== 'POST' || request.url !== '/v1/chat/completions') {
      sendJSON(response, 404, {
        error: { code: 'not_found', message: 'Unknown endpoint.' },
      });
      return;
    }
    if (busy) {
      response.setHeader('Retry-After', '30');
      sendJSON(response, 429, {
        error: {
          code: 'worker_busy',
          message: 'Local AI worker is busy. Retry later.',
        },
      });
      return;
    }
    busy = true;
    const controller = new AbortController();
    const cancel = () => {
      if (!response.writableEnded) controller.abort();
    };
    response.on('close', cancel);
    try {
      let chatRequest: ChatRequest;
      try {
        chatRequest = chatRequestSchema.parse(
          JSON.parse(
            await readBody(request, configuration.RESEARCH_AI_MAX_INPUT_BYTES),
          ),
        );
      } catch (error) {
        if (error instanceof z.ZodError || error instanceof SyntaxError)
          throw new ProviderError(
            400,
            'invalid_request',
            'Expected a text chat transcript and function tools. Images and attachments are unsupported.',
          );
        throw error;
      }
      const completion = await provider.complete(
        chatRequest,
        controller.signal,
      );
      const message = completionMessage(completion);
      const finishReason =
        completion.toolCalls.length > 0 ? 'tool_calls' : 'stop';
      const metadata = {
        id: `chatcmpl-${randomUUID()}`,
        created: Math.floor(Date.now() / 1000),
        model: configuration.RESEARCH_AI_MODEL,
      };
      if (chatRequest.stream) {
        response.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-store',
          Connection: 'keep-alive',
        });
        const toolCalls = message.tool_calls?.map((call, index) => ({
          ...call,
          index,
        }));
        response.write(
          `data: ${JSON.stringify({ ...metadata, object: 'chat.completion.chunk', choices: [{ index: 0, delta: { role: 'assistant', content: completion.content, ...(toolCalls && { tool_calls: toolCalls }) }, finish_reason: null }] })}\n\n`,
        );
        response.write(
          `data: ${JSON.stringify({ ...metadata, object: 'chat.completion.chunk', choices: [{ index: 0, delta: {}, finish_reason: finishReason }] })}\n\n`,
        );
        response.end('data: [DONE]\n\n');
      } else {
        sendJSON(response, 200, {
          ...metadata,
          object: 'chat.completion',
          choices: [{ index: 0, message, finish_reason: finishReason }],
        });
      }
    } catch (error) {
      const failure =
        error instanceof ProviderError
          ? error
          : new ProviderError(
              502,
              'invalid_response',
              'AI request failed or returned invalid data. Check worker configuration and input.',
            );
      if (!response.destroyed)
        sendJSON(response, failure.status, {
          error: { code: failure.code, message: failure.message },
        });
    } finally {
      response.off('close', cancel);
      busy = false;
    }
  });
  server.requestTimeout = configuration.RESEARCH_AI_TIMEOUT_MS + 5000;
  return server;
};
