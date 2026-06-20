import { describe, expect, it } from 'vitest';

import { createAgentHarnessMcpServer } from './server';

describe('agent catalog MCP server', () => {
  it('creates a server instance', () => {
    expect(createAgentHarnessMcpServer()).toBeDefined();
  });
});
