# Monorepo Structure

This repo separates agent behavior, runtime placement, shared deterministic
logic, and MCP protocol surfaces.

See `docs/runtime-layering.md` for the infrastructure-neutral layering model and
the Flue / Cloudflare / Vercel Eve selection rules.

## Layout

```text
agents/
  <agent>/             # Flue agent package
mcps/
  <server>/            # MCP server package
runtimes/
  node/                # Local Flue runtime
  cloudflare/          # Cloudflare Flue runtime
  <target>/            # Future runtime target, for example Vercel Eve
packages/
  <library>/           # Shared deterministic libraries
scripts/
  <task>.ts            # Deterministic generators and task runners
.agents/skills/
  <skill>/             # Repo-scoped Codex Agent Skills
```

## Ownership

- `agents/*` owns model behavior, instructions, Flue tools, and optional HTTP route middleware.
- `runtimes/*` owns deployment targets and agent mounting.
- `mcps/*` owns reusable tools, resources, and prompts exposed through Model Context Protocol.
- `packages/*` owns shared deterministic logic used by agents, MCP servers, runtimes, and scripts.
- `scripts/*` owns deterministic file generation and task runner behavior.
- `.agents/skills/*` owns Codex-facing procedures and repo-specific operating guidance.

## Decision Rules

Use a Flue agent when the capability is an agent experience:

- It receives user, webhook, or scheduled input.
- It needs model reasoning and multi-step behavior.
- It needs a local or Cloudflare runtime.
- It may need durable sessions or Cloudflare Durable Objects.

Use a Vercel Eve agent when the capability needs Vercel-native agent
infrastructure:

- It needs durable workflows, managed sandbox, or resumable sessions.
- It needs multi-channel delivery such as Slack, Discord, Teams, web chat, API,
  cron, or Linear.
- It benefits from Vercel Build Output, Workflows, Sandbox, Connect, Agent Runs,
  or AI Gateway.
- It should be generated from a framework-neutral plan rather than making
  `agents/*` depend directly on Eve filesystem conventions.

Use an MCP server when the capability is a reusable interface for AI clients:

- It exposes tools, resources, or prompts.
- It should be usable from Codex, Flue agents, Claude Desktop, or other MCP clients.
- It should not own model behavior itself.
- It can delegate deterministic repo operations to `packages/*` or `scripts/*`.

Use a task runner when the behavior is deterministic:

- It generates files.
- It updates mounts or package dependencies.
- It changes migrations.
- It should be reproducible without model reasoning.

Use an Agent Skill when the behavior is guidance:

- It teaches Codex how to decide or review.
- It captures repo-specific workflows.
- It should not execute account or filesystem mutations directly.

## Current Shared Base

`packages/agent-catalog` reads the workspace and returns:

- Flue agents under `agents/*`
- runtime mounts under `runtimes/*/src/agents`
- Cloudflare AI binding and Durable Object migrations

`mcps/agent-catalog` exposes that shared catalog through MCP:

- tools: `list_agents`, `inspect_agent`, `recommend_surface`
- resource: `agent-catalog://catalog`
- prompt: `design_agent`

This keeps repo inspection logic outside the MCP protocol layer, so Flue agents
can reuse the same package later.

## Migrated Memoli

`packages/memoli` contains the migrated memoli CLI and implementation:

- Markdown daily/memo commands
- task store and task tree logic
- memoli MCP tool handlers

`mcps/memoli` is a thin stdio MCP wrapper around the package implementation.
Keep future memoli behavior in `packages/memoli`; keep the protocol entrypoint
in `mcps/memoli`.
