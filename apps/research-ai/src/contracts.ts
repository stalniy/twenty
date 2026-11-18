import { z } from 'zod';

export const assessmentSchema = z.strictObject({
  summary: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  findings: z.array(
    z.strictObject({ claim: z.string(), evidenceIds: z.array(z.string()) }),
  ),
  unknowns: z.array(z.string()),
});

export type StructuredAssessment = z.infer<typeof assessmentSchema>;
export const evidenceSchema = z.array(
  z.strictObject({ id: z.string().min(1), text: z.string() }),
);
export type Evidence = z.infer<typeof evidenceSchema>;
export type ResearchAIProvider = {
  analyze: (
    evidence: Evidence,
    context: string,
  ) => Promise<StructuredAssessment>;
};

export const chatRequestSchema = z.object({
  model: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'developer', 'user', 'assistant', 'tool']),
        content: z
          .union([
            z.string(),
            z.null(),
            z.array(z.object({ type: z.literal('text'), text: z.string() })),
          ])
          .optional(),
        tool_call_id: z.string().optional(),
        tool_calls: z
          .array(
            z.object({
              id: z.string(),
              type: z.literal('function'),
              function: z.object({ name: z.string(), arguments: z.string() }),
            }),
          )
          .optional(),
        name: z.string().optional(),
      }),
    )
    .min(1),
  tools: z
    .array(
      z.object({
        type: z.literal('function'),
        function: z.object({
          name: z.string(),
          description: z.string().optional(),
          parameters: z.record(z.string(), z.unknown()),
        }),
      }),
    )
    .optional(),
  tool_choice: z
    .union([
      z.enum(['auto', 'none', 'required']),
      z.object({
        type: z.literal('function'),
        function: z.object({ name: z.string() }),
      }),
    ])
    .optional(),
  response_format: z
    .object({
      type: z.enum(['text', 'json_object', 'json_schema']),
      json_schema: z
        .object({
          name: z.string(),
          schema: z.record(z.string(), z.unknown()),
          strict: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  stream: z.boolean().optional(),
  max_tokens: z.number().int().positive().optional(),
  max_completion_tokens: z.number().int().positive().optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const completionSchema = z.strictObject({
  content: z.string(),
  toolCalls: z.array(
    z.strictObject({ name: z.string(), arguments: z.string() }),
  ),
});
export type Completion = z.infer<typeof completionSchema>;
export type ChatProvider = {
  complete: (request: ChatRequest, signal?: AbortSignal) => Promise<Completion>;
};

export class ProviderError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
