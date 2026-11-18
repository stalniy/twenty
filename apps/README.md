# Local Twenty apps

This is an independent Yarn workspace for locally developed Twenty apps. Run its commands from this directory; the CRM monorepo's root workspace does not include these packages.

```bash
cd apps
yarn install
yarn test
yarn typecheck
yarn build
```

Open `apps.code-workspace` to work on these apps separately in VS Code.

- [Job Collector](job-collector/README.md): Ashby and Lever collection, salary prioritization, source history, and daily/manual workflows.
- [Research AI](research-ai/README.md): local Codex subscription bridge for Twenty's built-in AI chat, with an explicit OpenAI API fallback.

Each app has its own source and version. Dependencies are locked together in this workspace's `yarn.lock`. Credentials, local bindings, generated staging files, and build artifacts stay out of Git.
