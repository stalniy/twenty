import { z } from 'zod';

import { readConfiguration } from './config.ts';
import { evidenceSchema, ProviderError } from './contracts.ts';
import { createChatProvider, createResearchAIProvider } from './provider.ts';
import { readBody } from './server.ts';

try {
  const configuration = readConfiguration();
  const input = z
    .object({ evidence: evidenceSchema, context: z.string() })
    .parse(
      JSON.parse(
        await readBody(
          process.stdin,
          configuration.RESEARCH_AI_MAX_INPUT_BYTES,
        ),
      ),
    );
  const provider = createResearchAIProvider(
    createChatProvider(configuration),
    configuration.RESEARCH_AI_MODEL,
  );
  console.log(
    JSON.stringify(await provider.analyze(input.evidence, input.context)),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      error: error instanceof ProviderError ? error.code : 'invalid_request',
      message:
        error instanceof ProviderError
          ? error.message
          : 'Check research input and environment configuration.',
    }),
  );
  process.exitCode = 1;
}
