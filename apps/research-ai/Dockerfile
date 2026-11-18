FROM node:24-bookworm-slim AS dependencies

WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock ./
COPY job-collector/package.json ./job-collector/
COPY research-ai/package.json ./research-ai/
RUN YARN_NODE_LINKER=node-modules YARN_ENABLE_SCRIPTS=false yarn workspaces focus @local/research-ai --production

FROM node:24-bookworm-slim

ARG CODEX_VERSION=0.160.1
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --global @openai/codex@${CODEX_VERSION} && npm cache clean --force

WORKDIR /app/research-ai
COPY --from=dependencies /app/node_modules /app/node_modules
COPY research-ai/package.json ./
COPY research-ai/src ./src

USER node
CMD ["node", "src/bridge.ts"]
