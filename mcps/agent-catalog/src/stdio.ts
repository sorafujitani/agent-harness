import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createAgentHarnessMcpServer } from './server';

const server = createAgentHarnessMcpServer({
  rootDir: process.env.AGENT_HARNESS_ROOT ?? process.cwd(),
});

await server.connect(new StdioServerTransport());
