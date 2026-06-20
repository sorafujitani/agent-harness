import {
  formatAgentCatalogMarkdown,
  getAgentCatalog,
  recommendSurface,
  type SurfaceRecommendationInput,
} from '@agent-harness/agent-catalog';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export type CreateAgentHarnessMcpServerOptions = {
  rootDir?: string;
  name?: string;
  version?: string;
};

export function createAgentHarnessMcpServer(options: CreateAgentHarnessMcpServerOptions = {}) {
  const server = new McpServer({
    name: options.name ?? 'agent-catalog',
    version: options.version ?? '0.0.0',
  });

  const resolveRoot = (rootDir?: string) => rootDir ?? options.rootDir ?? process.cwd();

  server.registerTool(
    'list_agents',
    {
      description: 'List Flue agents, mounted runtimes, and Cloudflare platform bindings.',
      inputSchema: {
        rootDir: z.string().optional(),
      },
    },
    async ({ rootDir }) => {
      const catalog = await getAgentCatalog(resolveRoot(rootDir));

      return {
        content: [
          {
            type: 'text',
            text: formatAgentCatalogMarkdown(catalog),
          },
        ],
      };
    },
  );

  server.registerTool(
    'inspect_agent',
    {
      description: 'Inspect one agent package and the runtimes where it is mounted.',
      inputSchema: {
        name: z.string(),
        rootDir: z.string().optional(),
      },
    },
    async ({ name, rootDir }) => {
      const catalog = await getAgentCatalog(resolveRoot(rootDir));
      const agent = catalog.agents.find((entry) => entry.name === name);

      if (!agent) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Agent "${name}" was not found.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(agent, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    'recommend_surface',
    {
      description:
        'Recommend whether a requested capability belongs in Codex, a task runner, Agent Skill, Flue agent, or MCP server.',
      inputSchema: {
        goal: z.string(),
        needsLocalFiles: z.boolean().optional(),
        needsExternalAccess: z.boolean().optional(),
        needsAlwaysOn: z.boolean().optional(),
        reusableByOtherClients: z.boolean().optional(),
        deterministicScaffold: z.boolean().optional(),
      },
    },
    async (input: SurfaceRecommendationInput) => {
      const recommendation = recommendSurface(input);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(recommendation, null, 2),
          },
        ],
      };
    },
  );

  server.registerResource(
    'agent-catalog',
    'agent-catalog://catalog',
    {
      title: 'Agent Harness Catalog',
      description: 'Current Flue agents, runtime mounts, and Cloudflare bindings in this repo.',
      mimeType: 'application/json',
    },
    async (uri) => {
      const catalog = await getAgentCatalog(resolveRoot());

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(catalog, null, 2),
          },
        ],
      };
    },
  );

  server.registerPrompt(
    'design_agent',
    {
      title: 'Design Agent',
      description: 'Prompt template for deciding the correct implementation surface.',
      argsSchema: {
        goal: z.string(),
      },
    },
    ({ goal }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Goal: ${goal}`,
              '',
              'Decide the right surface: one-shot Codex task, task runner, Agent Skill, local Flue agent, Cloudflare Flue agent, or MCP server.',
              'Return the recommendation, runtime placement, state needs, files to create, and verification commands.',
            ].join('\n'),
          },
        },
      ],
    }),
  );

  return server;
}
