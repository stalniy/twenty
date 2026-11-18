import { readConfiguration } from './config.ts';
import { createChatProvider } from './provider.ts';
import { createBridge } from './server.ts';

const configuration = readConfiguration();
const server = createBridge(configuration, createChatProvider(configuration));
server.listen(
  configuration.RESEARCH_AI_PORT,
  configuration.RESEARCH_AI_HOST,
  () => {
    console.log(
      `Twenty AI bridge listening on ${configuration.RESEARCH_AI_HOST}:${configuration.RESEARCH_AI_PORT} (${configuration.RESEARCH_AI_PROVIDER})`,
    );
  },
);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close();
    server.closeAllConnections();
  });
}
