# Local AI for Twenty

This bridge connects Twenty's built-in AI chat to the official `codex exec` CLI using the host user's existing ChatGPT login. The root Docker Compose stack runs the bridge with the host's Codex folder mounted. Twenty uses its existing `@ai-sdk/openai-compatible` provider; no frontend changes or Codex credentials in Twenty are required. A separate bridge secret authenticates the backend connection.

## Authentication investigation — 2026-11-16

| Approach                | Findings                                                                                                                                                                                                     | Local verification                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Codex CLI / SDK      | Official noninteractive execution reuses CLI authentication. CLI and SDK support structured output. The CLI owns login and refresh; the bridge never opens, copies, or edits its credential files.           | Installed CLI `0.160.1`: `codex login status` reported `Logged in using ChatGPT`. A read-only, noninteractive call succeeded with API-key variables absent. Twenty's installed AI SDK also completed a streamed dummy tool-call/result round trip through the bridge. |
| B. Sign in with ChatGPT | Current documentation supports optional ChatGPT plan usage for eligible local/open-source applications. This is a separate app registration and explicit OAuth consent, not permission inherited from Codex. | Not authorized or tested for this app. No new OAuth flow was started.                                                                                                                                                                                                 |
| C. OpenAI API           | Supported server-side API-key authentication with structured output. Select explicitly when operational reliability warrants separate API billing.                                                           | HTTP contract, limits, refusal, truncation and failure behavior tested with mocks. No paid API request made.                                                                                                                                                          |

The [Codex platform guide](https://developers.openai.com/blog/codex-as-a-platform) identifies CLI and SDK integration options. The [noninteractive guide](https://learn.chatgpt.com/docs/non-interactive-mode) documents saved authentication, scheduled jobs and output schemas. Local account authentication works here; it is not an uptime guarantee. CI guidance recommends API keys by default. This integration is for a trusted local installation, not a public inference service.

The [ChatGPT integration article](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt) distinguishes identity from plan permission. A future direct integration must follow [registration and sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in): stable host ID, PKCE, state and nonce, issued client ID, verified ID-token signature/issuer/audience/expiry/nonce, and granted `chatgpt.tokens.use.direct` scope. Identity alone is insufficient. [Session guidance](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions) requires protected app-owned storage and serialized rotating refreshes. Neither plan eligibility nor this app's grant was inferred from the existing Codex login. Paid or remotely hosted distribution has separate access requirements.

## Start and connect

For the configured installation, run from the repository root:

```bash
docker compose up -d --build
```

This starts Twenty, its worker, PostgreSQL, Redis, and the AI bridge. Later starts only need `docker compose up -d`; use `--build` after changing bridge source. The bridge restarts automatically, and server and worker wait for its health check. Stop everything with `docker compose down`.

The bridge reads `apps/research-ai/.env`. Both Twenty services read `AI_PROVIDERS` from the root `.env`, with `baseUrl` set to `http://research-ai:8787/v1`. After changing the bridge secret or model, update both configurations and run `docker compose up -d` again. Merge any additional custom providers into `AI_PROVIDERS`. Database-level configuration overrides may also need adjusting in the admin panel.

Compose mounts `${CODEX_HOME:-$HOME/.codex}` at `/home/node/.codex`. It must already exist and contain file-based Codex login credentials; a macOS Keychain-only login cannot be used by a Linux container. The mount is writable so the CLI can refresh its login. Credentials are not copied into the image. `RESEARCH_AI_UID` and `RESEARCH_AI_GID` in the root `.env` set the container user to the host folder owner. The bridge listens on the internal Docker network without publishing a host port.

For first-time configuration, run `yarn install` from `apps/`, then:

```bash
cd research-ai
codex login status
# Use an available model for your signed-in account; no model is hardcoded.
yarn configure <available-account-model>
```

`configure` exclusively creates `.env` and `.env.twenty` with permissions `0600`; it refuses to overwrite existing configuration. Both files are ignored by Git. `RESEARCH_AI_MODEL` must be supplied. The local verification used `gpt-6.1-sol`; availability can change. Codex CLI must support the flags used in `src/codex.ts` (verified with `0.160.1`).

Copy the generated `AI_PROVIDERS` value from `.env.twenty` into the root `.env` before starting Compose. Set `RESEARCH_AI_UID` and `RESEARCH_AI_GID` there to the output of `id -u` and `id -g` when your host user differs from the default `1000:1000`.

In Twenty's AI chat model picker, choose **Local Codex (ChatGPT plan)**. Standard Twenty tool execution, permissions and approval flows remain in Twenty. The bridge proposes function calls; it does not execute CRM tools. Custom-provider access remains subject to Twenty's existing entitlement checks.

For manual host use, `yarn start` binds only `127.0.0.1:8787`. Use `http://host.docker.internal:8787/v1` as the provider URL for Docker-hosted Twenty, or `http://127.0.0.1:8787/v1` for host-native Twenty. Set `RESEARCH_AI_BASE_URL` to the same URL when running `yarn smoke` against a host bridge. Do not expose the bridge publicly.

Run `yarn smoke` with the bridge and `twenty-server-1` running to test the installed Twenty SDK, including a dummy function call. This uses subscription allowance but does not read CRM records.

## Background and scheduled use

The Docker installation needs no host service. For optional host-native use on macOS, `yarn install-service` registers `local.twenty.research-ai` with launchd for the current user's login session. It restarts on failure. The generated plist and logs are under ignored `.local/`. Keep the checkout and Node binary at their current paths. Run the installer again after a new login; it does not install a system daemon or configure automatic login. Stop it with:

```bash
launchctl bootout gui/$(id -u)/local.twenty.research-ai
```

Twenty's queue worker can use this provider for scheduled AI jobs while Docker and the bridge are running. This does not create a new research schedule. Sleeping, Docker shutdown, expired/revoked sessions, account limits and network outages interrupt jobs. Codex handles its own normal credential refresh. If that fails, the bridge returns `authentication_required`; run `codex login` on the host using the mounted Codex folder. No browser login is launched during a scheduled request.

Usage limits return `429 usage_limit`; review usage in ChatGPT and wait for reset. Requests have a timeout, cancellation, a bounded input body, and a single concurrent job. Busy requests return `429 worker_busy`. Errors are sanitized; prompts, CLI diagnostics and credentials are not returned in errors or written to bridge logs. There are no automatic provider switches or application retries that could unexpectedly consume paid API usage. Twenty's own retry policy still applies.

## Limits and API fallback

| Variable                        | Default / purpose                                                  |
| ------------------------------- | ------------------------------------------------------------------ |
| `RESEARCH_AI_PROVIDER`          | `codex`; explicitly set `openai` for API billing                   |
| `RESEARCH_AI_MODEL`             | Required, account-accessible model ID                              |
| `RESEARCH_AI_SECRET`            | Required, at least 32 characters, shared only with Twenty backend  |
| `RESEARCH_AI_HOST`              | `127.0.0.1`; Compose sets `0.0.0.0` inside the container           |
| `RESEARCH_AI_PORT`              | `8787`, loopback only                                              |
| `RESEARCH_AI_TIMEOUT_MS`        | `300000`                                                           |
| `RESEARCH_AI_MAX_INPUT_BYTES`   | `200000`                                                           |
| `RESEARCH_AI_MAX_OUTPUT_TOKENS` | `4096`, enforced on OpenAI API requests                            |
| `OPENAI_API_KEY`                | Required only for `openai`; environment or a protected host secret |
| `CODEX_BINARY`                  | `codex`, resolved through worker PATH                              |

To switch, edit the ignored `apps/research-ai/.env` and run `docker compose up -d` from the root to recreate the bridge. Update the model in the root `.env`'s `AI_PROVIDERS` if the selected model changes. API fallback calls the official `https://api.openai.com/v1/chat/completions` endpoint with `store:false`; it never reuses Codex OAuth credentials. It supports [strict JSON Schema output](https://developers.openai.com/api/docs/guides/structured-outputs) with local schema validation. Choose a model supporting chat completions, function calls and structured output. No paid API fallback occurs automatically.

Codex does not expose a hard output-token cap through this CLI interface: its limits are timeout, input size, output-file size and subscription allowance. Do not interpret the configured API token cap as a Codex spending cap. The bridge currently omits token usage instead of inventing API-equivalent billing counts; Twenty's token/cost display cannot account accurately for subscription use.

Chat history and tool results are forwarded on every turn to a new ephemeral Codex job. Native Codex shell execution and web search are disabled, user config is ignored, and the job runs read-only in a temporary directory. Child environment contains only host/runtime paths needed by the CLI, excluding API keys, bridge secrets and database credentials. Required machine policies still apply.

Only text messages and function tools are supported. Images and attachments fail explicitly. SSE is emitted after each Codex job completes, so the chat works but does not display token-by-token generation. Tool arguments and requested JSON output are schema-validated before returning to Twenty. Model/schema failures stop the turn. This adapter does not expose embeddings, transcription, native web search, parallel execution, or a Responses API endpoint.

## Installed skills

The job-matching workflow explicitly requests `jd-matching` with a `Use $jd-matching.` line in its system/developer instructions. The bridge loads the current `$CODEX_HOME/skills/jd-matching/SKILL.md` and supplies its contents to Codex before the transcript. This makes the installed skill available with native shell execution disabled; the model does not need filesystem tools to read it. User messages, posting evidence and tool results cannot request a skill load. Missing or invalid skills return `503 skill_unavailable` rather than falling back to improvised matching instructions.

The existing Codex home mount includes this skill in Docker. No image rebuild is needed after editing the skill, since it is read per request. Only this named skill is supported, and it must be self-contained in `SKILL.md`; referenced scripts or supporting files are not loaded. Skill loading applies to the Codex provider, not the optional OpenAI API fallback. The Twenty adapter supplies the output schema separately from the matching method. See [official skill documentation](https://learn.chatgpt.com/docs/build-skills) for skill structure and invocation.

## Research interface and checks

`ResearchAIProvider.analyze(evidence, context)` in `src/contracts.ts` returns a validated `StructuredAssessment` containing summary, confidence, findings with evidence IDs, and unknowns. `createResearchAIProvider` wraps either backend; the abstraction has no Twenty or Codex dependency. Unknown or missing finding citations fail validation. It does not automatically write assessments to CRM records.

```bash
echo '{"evidence":[{"id":"source-1","text":"Supplied evidence"}],"context":"Assess the evidence"}' | yarn analyze
yarn test
yarn typecheck
yarn lint
```

Tests cover actual subprocess invocation and cleanup, timeout handling, credential isolation, authentication/limit errors, schema and citation validation, API contracts, and HTTP/SSE behavior. Live verification covers saved-login execution, Twenty's installed SDK tool round trip, and a structured assessment with validated evidence citations. An actual browser chat turn and production scheduling guarantees require separate verification.
