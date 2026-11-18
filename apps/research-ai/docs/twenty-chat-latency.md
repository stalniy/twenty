# Research AI latency in Twenty chat

Measured on November 18, 2026, against the local Docker stack. Source references use checkout `d0ba1459fe2`.

## What we measured

Three sequential loopback requests inside the Research AI container asked for the exact reply `OK` and set `stream: true`. The bridge returned HTTP 200 and one text chunk each time. Response headers, first text, and completion arrived at the same measured millisecond in all three runs.

| Check                                     |  Elapsed |
| ----------------------------------------- | -------: |
| Twenty health endpoint from the host      |   4.3 ms |
| Research AI model discovery over loopback |    28 ms |
| Bridge completion 1                       | 4,179 ms |
| Bridge completion 2                       | 5,004 ms |
| Bridge completion 3                       | 4,878 ms |

The AI SDK installed in the Twenty server container completed a second synthetic check in two model steps. The tool call arrived at 4,926 ms, the dummy tool result at 4,927 ms, the first text at 10,504 ms, and the turn completed at 10,507 ms. The dummy tool took about a millisecond. This shows how an additional model step can roughly double the wait even when the tool is fast.

An isolated check invoked the real bridge request handler with a synthetic provider and a mock HTTP response. With provider delays of 0, 350, and 700 ms, the handler wrote headers and the first SSE chunk at 2, 352, and 702 ms respectively. The entire reply was in the first chunk. The isolated check demonstrated how the handler translates provider time directly into time spent waiting for text. The live measurements exercised the configured provider on synthetic data. Browser rendering and the timing of a real research prompt remain unmeasured.

## Where the chat waits

- **The bridge buffers the full reply.** It waits for `provider.complete()` before writing SSE headers, then writes the entire answer as a single content delta. The Codex provider starts a new ephemeral subprocess on each request, discards stdout, and waits for exit before reading the final JSON from disk. Validation runs before the bridge emits the first event. This accounts for the all-at-once replies and the four-to-five-second wait for a one-word reply at the provider boundary. The measurement does not break that time down into Codex startup, upstream network, and model generation. [Bridge HTTP handler](../src/server.ts#L128), [Codex subprocess](../src/codex.ts#L75), [Completion validation](../src/provider.ts#L195)
- **Tool use repeats the wait.** Twenty's model loop can execute a tool and send another completion request with its result. The bridge serializes the supplied transcript and tool definitions into each new Codex prompt. A turn that needs multiple model steps accumulates their individual waits plus the tool execution time. [Twenty model loop](../../../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/services/agent-step-loop.service.ts#L254), [Codex prompt construction](../src/codex.ts#L54), [SDK tool smoke test](../src/smoke.ts#L14)
- **Concurrent calls can receive a busy response.** The worker serves one completion at a time and returns HTTP 429 with `Retry-After: 30` to concurrent callers. If a client retries, this can add further delay during overlap with another chat or background run. The measured requests were sequential and each returned HTTP 200. [Busy response](../src/server.ts#L95)
- **The optional paid API backend currently buffers too.** It sets upstream `stream: false` and reads the completed JSON through the same bridge handler. Switching that setting alone would still leave the outer bridge waiting for `provider.complete()`. [OpenAI fallback](../src/provider.ts#L43), [OpenAI streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses)

## Next measurements and changes

1. Measure a synthetic new-thread chat in the browser from Send to first visible text and to completion. Record the number and timing of model and tool steps, and compare with the direct bridge sample. Twenty already records `ai-chat/ttft-ms` from model-loop start to the first text delta **or tool call**, plus per-step, tool, and whole model-loop latency. The browser measurement captures work before that loop and the gap between a tool call and visible text. [Twenty metrics](../../../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/services/agent-step-loop.service.ts#L239), [TTFT and end-to-end measurement](https://developers.openai.com/api/docs/guides/latency-optimization)
2. For lower total latency, compare explicit lower Codex reasoning effort on the same simple prompts and representative tool or structured-output tasks. The bridge passes `--ignore-user-config`, so changing the user's Codex configuration alone will not set the bridge's reasoning effort. Measure a candidate speedup and check tool-selection and output quality before changing the default. [Bridge CLI arguments](../src/codex.ts#L75), [Codex reasoning configuration](https://learn.chatgpt.com/docs/config-file/config-reference), [Codex non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)
3. For earlier visible text, evaluate a backend that exposes text deltas. Codex App Server documents both agent-message deltas and per-turn output schemas. The current CLI's documented JSONL example emits the assistant text at item completion. A prototype must extract assistant text from the structured envelope, preserve final schema checks, and dispatch CRM tools only after validating complete arguments. Keep timing time to first text independently of total latency. [Codex App Server](https://learn.chatgpt.com/docs/app-server), [Codex CLI JSONL](https://learn.chatgpt.com/docs/non-interactive-mode)
