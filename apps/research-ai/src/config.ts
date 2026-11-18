import { z } from 'zod';

const configurationSchema = z.object({
  RESEARCH_AI_PROVIDER: z.enum(['codex', 'openai']).default('codex'),
  RESEARCH_AI_MODEL: z.string().min(1),
  RESEARCH_AI_SECRET: z.string().min(32),
  RESEARCH_AI_HOST: z.enum(['127.0.0.1', '0.0.0.0']).default('127.0.0.1'),
  RESEARCH_AI_PORT: z.coerce.number().int().min(1024).max(65535).default(8787),
  RESEARCH_AI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(600000)
    .default(300000),
  RESEARCH_AI_MAX_INPUT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .max(1000000)
    .default(200000),
  RESEARCH_AI_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .positive()
    .default(4096),
  OPENAI_API_KEY: z.string().min(1).optional(),
  CODEX_BINARY: z.string().min(1).default('codex'),
});

export const readConfiguration = (
  environment: NodeJS.ProcessEnv = process.env,
) => {
  const configuration = configurationSchema.parse(environment);
  if (
    configuration.RESEARCH_AI_PROVIDER === 'openai' &&
    !configuration.OPENAI_API_KEY
  ) {
    throw new Error(
      'OPENAI_API_KEY is required for the explicitly selected openai provider',
    );
  }
  return configuration;
};

export type Configuration = ReturnType<typeof readConfiguration>;
