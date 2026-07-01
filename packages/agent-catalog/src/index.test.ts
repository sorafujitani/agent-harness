import { describe, expect, it } from 'vitest';

import { formatAgentCatalogMarkdown, getAgentCatalog, recommendSurface } from './index';

describe('agent catalog', () => {
  it('reads agents and runtimes from the workspace', async () => {
    const catalog = await getAgentCatalog();

    expect(catalog.agents.some((agent) => agent.name === 'hello')).toBe(true);
    expect(catalog.runtimes.some((runtime) => runtime.name === 'cloudflare')).toBe(true);
    expect(catalog.runtimes.find((runtime) => runtime.name === 'cloudflare')?.framework).toBe(
      'flue',
    );
    expect(catalog.runtimes.find((runtime) => runtime.name === 'cloudflare')?.target).toBe(
      'cloudflare',
    );
    expect(catalog.agents.some((agent) => agent.name === 'vercel')).toBe(true);
    expect(catalog.runtimes.find((runtime) => runtime.name === 'vercel')?.framework).toBe('eve');
    expect(catalog.runtimes.find((runtime) => runtime.name === 'vercel')?.target).toBe('vercel');
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

  it('recommends Eve for Vercel-native durable agent infrastructure', () => {
    expect(
      recommendSurface({
        goal: 'Ship an agent with sandboxed code execution and Slack delivery',
        needsManagedSandbox: true,
        needsMultiChannel: true,
      }).surface,
    ).toBe('vercel-eve-agent');
  });
});
