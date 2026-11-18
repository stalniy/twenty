# Self-hosted Docker telemetry audit

Reviewed 2026-11-11 at commit `c105d203dbd6dd1fea3c4558e6e8fec297eefc32`.

This is static source analysis. Repository contents were treated as untrusted data; no repository scripts, dependencies, containers or application code were executed. This does not establish what an independently published Docker image contains, or what an existing deployment has already sent.

## Conclusion

The source includes enabled-by-default outbound self-hosting telemetry. New-user creation emits personal information to a hard-coded external endpoint. It is configurable, but the supplied Compose file and example environment file do not expose the switch. No user-consent check appears in the traced publishing path. The sender silently catches failures. These facts support calling it easy to overlook; they do not establish malicious intent.

## Sign-up telemetry

- Default: `TELEMETRY_ENABLED = true` in [config-variables.ts](../src/engine/core-modules/twenty-config/config-variables.ts#L974).
- Trigger and actual payload: [sign-in-up.service.ts](../src/engine/core-modules/auth/services/sign-in-up.service.ts#L420) emits the sign-up event after saving a new user. The payload contains user ID, email, first name, last name, locale, server URL and server ID, plus workspace ID and user-workspace ID if available. Some values can be absent or empty at creation time.
- Delivery: [telemetry.listener.ts](../src/engine/api/graphql/workspace-query-runner/listeners/telemetry.listener.ts#L13) forwards the event to [telemetry.service.ts](../src/engine/core-modules/telemetry/telemetry.service.ts#L22).
- Destination: HTTPS POST to `https://twenty-telemetry.com/api/v2/selfHostingEvent`, with the action and event fields. There is no localhost exception, anonymization or consent test in this path. The service returns immediately when the telemetry flag is false; otherwise failures are caught without logging in this service.
- This is tied to user creation, not merely starting an idle container. The reviewed publisher has only this sign-up listener as a caller. No periodic heartbeat or CRM-record export was found in that path. The recipient can also observe the connection's source IP.

## Docker and configuration pitfalls

[docker-compose.yml](../../twenty-docker/docker-compose.yml) uses `twentycrm/twenty:${TAG:-latest}` for server and worker. Neither service passes `TELEMETRY_ENABLED`, and neither uses an `env_file`. [.env.example](../../twenty-docker/.env.example) does not mention telemetry. Adding a variable only to the Compose `.env` file therefore does not inject it into these containers.

Database configuration defaults on ([config-variables.ts](../src/engine/core-modules/twenty-config/config-variables.ts#L1541)). For variables such as telemetry, a stored database value wins over the environment ([twenty-config.service.ts](../src/engine/core-modules/twenty-config/twenty-config.service.ts#L56)). Check the effective value in Settings / Admin Panel / Configuration Variables on an existing instance.

For a new deployment, add this to each existing server and worker `environment` mapping, or use a Compose override:

```yaml
services:
  server:
    environment:
      TELEMETRY_ENABLED: "false"
  worker:
    environment:
      TELEMETRY_ENABLED: "false"
```

Recreate both containers to apply environment changes. On an existing instance, also set the database-backed telemetry setting to false if present. Environment-only configuration can instead be enforced with `IS_CONFIG_VARIABLES_IN_DB_ENABLED=false`, but that disables database configuration for all settings, so migrate any other required settings to the environment first. No deployment configuration was changed during this audit.

## Other tracking and outbound calls

| Mechanism | Default and behavior | Source |
| --- | --- | --- |
| Browser page analytics | Unconditional pageview effects send paths, locale, browser user agent, stripped URL/referrer, time zone and session UUID to the instance's own GraphQL API. Code attempts to set a 30-minute `analyticsCookie`. Neither the telemetry flag nor `ANALYTICS_ENABLED=false` prevents this frontend behavior. This alone is not an external vendor upload. | [TrackPageViewEffect.tsx](../../twenty-front/src/modules/analytics/components/TrackPageViewEffect.tsx#L26), [useEventTracker.ts](../../twenty-front/src/modules/analytics/hooks/useEventTracker.ts#L21), [RootAppProviders.tsx](../../twenty-front/src/modules/app/components/RootAppProviders.tsx#L47), [event-log-emitter.resolver.ts](../src/engine/core-modules/event-logs/emit/event-log-emitter.resolver.ts#L86) |
| ClickHouse event storage | Uses configured `CLICKHOUSE_URL`; no default URL in the config class or standard Compose file. Sink returns without writing if no client exists. `ANALYTICS_ENABLED` defaults false, but this is not a universal kill switch: ClickHouse client construction checks the URL. | [clickhouse.service.ts](../src/database/clickhouse/clickhouse.service.ts#L36), [clickhouse-event.sink.ts](../src/engine/core-modules/event-logs/ingest/clickhouse-event.sink.ts#L25) |
| Sentry errors/traces | Server defaults to console; DSNs are unset. Server instrumentation requires Sentry driver. Browser instrumentation requires a frontend DSN independently of the server driver. If previously configured, clear both DSNs as well as choosing console. | [config-variables.ts](../src/engine/core-modules/twenty-config/config-variables.ts#L1298), [instrument.ts](../src/instrument.ts#L62), [SentryInitEffect.tsx](../../twenty-front/src/modules/error-handler/components/SentryInitEffect.tsx#L30), [client-config.service.ts](../src/engine/core-modules/client-config/services/client-config.service.ts#L237) |
| OpenTelemetry metrics | No meter drivers by default; outbound OTLP exporter is constructed only when explicitly selected. | [config-variables.ts](../src/engine/core-modules/twenty-config/config-variables.ts#L1322), [instrument.ts](../src/instrument.ts#L162) |
| Enterprise reporting | With a valid configured Enterprise key, periodic validation and seat reporting POST to `https://twenty.com/api/enterprise/validate` and `/seats`. Metadata includes server ID/URL, version, environment, workspace/user counts, earliest active user's email, timestamp and telemetry setting. `TELEMETRY_ENABLED=false` does not stop these calls. Without a key these methods return before contacting the API. | [enterprise-plan.service.ts](../src/engine/core-modules/enterprise/services/enterprise-plan.service.ts#L287), [metadata gathering](../src/engine/core-modules/enterprise/services/enterprise-plan.service.ts#L674), [scheduled job](../src/engine/core-modules/enterprise/cron/jobs/organization-key-validation.cron.job.ts#L32) |
| Default favicon/logo | Browser can automatically request `https://twentyhq.github.io/placeholder-images/workspaces/twenty-logo.png` when no workspace logo is available, exposing browser IP/request metadata. Independent of telemetry flag. | [DefaultWorkspaceLogo.ts](../../twenty-front/src/modules/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo.ts#L1), [PageFavicon.tsx](../../twenty-front/src/modules/app/components/PageFavicon.tsx#L12) |
| Update lookup | Admin version-info query fetches Docker Hub tags. This is separate from telemetry. | [admin-panel-version.service.ts](../src/engine/core-modules/admin-panel/services/admin-panel-version.service.ts#L19) |
| Support chat | Off by default (`NONE`). Configured FRONT support loads Front's chat script and provides logged-in user identity. | [config-variables.ts](../src/engine/core-modules/twenty-config/config-variables.ts#L1442), [useInstantiateSupportChat.ts](../../twenty-front/src/modules/support/hooks/useInstantiateSupportChat.ts#L54) |

Optional integrations, AI services, application registries, CAPTCHA, booking UI, tutorials and remote images can produce additional external traffic when used. Disabling sign-up telemetry is not a promise of offline operation.

Analytics follow-up: the standard Compose deployment has no `CLICKHOUSE_URL`, so the default ClickHouse sink is filtered out by [event-sink-availability.ts](../src/engine/core-modules/event-logs/ingest/event-sink-availability.ts#L3). With no available sinks, [event-log-emitter.service.ts](../src/engine/core-modules/event-logs/emit/event-log-emitter.service.ts#L37) returns without ingesting events. Browser pageview requests still occur. A configured ClickHouse URL can enable persistence independently of `ANALYTICS_ENABLED`; the destination is operator-configured, not a hard-coded Twenty analytics endpoint. Setting `EVENT_SINKS` to the JSON array `[]` in both containers disables this sink pipeline, including other event logs, but does not stop frontend pageview requests or cookie attempts. Stopping that browser collection requires a frontend change in this checkout.

## Disclosure and confidence

The repository's [privacy-policy component](../../twenty-website/src/sections/legal/PrivacyPolicyDocument.tsx#L154) acknowledges limited self-hosted information collection for licensing and optional telemetry. No telemetry mention was found in the English self-hosting docs or supplied Docker/server example environment files searched. The [official upstream configuration source](https://github.com/twentyhq/twenty/blob/main/packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts) also exposes the enabled default; local source and the commit above are the authority for this audit.

Confidence is high in the traced sign-up disclosure and configuration behavior. This was not a full dependency/supply-chain audit or a packet capture. A mutable `latest` image may differ from this checkout. For assurance about the actual deployment, pin the image digest and observe both container egress and browser requests with disposable data. Enforce outbound allowlists on both where zero unapproved external traffic is required; container-only restrictions do not cover the browser's remote assets.
