import { describe, expect, it } from 'vitest';

import { formatAgentCatalogMarkdown, getAgentCatalog, recommendSurface } from './index';

describe('agent catalog', () => {
  it('reads agents and runtimes from the workspace', async () => {
    const catalog = await getAgentCatalog();

    expect(catalog.agents.some((agent) => agent.name === 'hello')).toBe(true);
    expect(catalog.runtimes.some((runtime) => runtime.name === 'cloudflare')).toBe(true);
    expect(formatAgentCatalogMarkdown(catalog)).toContain('## Agents');
  });

  it('recommends MCP for reusable client-facing tools', () => {
    expect(
      recommendSurface({
        goal: 'Expose agent catalog to multiple AI clients',
        reusableByOtherClients: true,
      }).surface,
    ).toBe('mcp-server');
  });
});
