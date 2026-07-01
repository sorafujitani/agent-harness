# Runtime Layering

This repo should let an agent choose the right infrastructure without baking
Cloudflare, Flue, Vercel, or Eve decisions into the agent's job description.

## Layers

```text
agent intent
  what the agent does, who it serves, model behavior, required capabilities
framework adapter
  Flue package, Eve directory, or another framework-specific authoring shape
runtime target
  local Node, Cloudflare Worker, Vercel Build Output, or self-hosted Node
provider operations
  secrets, deploy command, migrations, workflow state, observability, smoke tests
```

Keep each layer explicit:

- `agents/*` owns reusable agent behavior and tests.
- `runtimes/*` owns deployment targets and mount or build shape.
- `packages/*` owns shared deterministic planning, catalog, and generation logic.
- `scripts/*` owns repeatable file generation.
- `.agents/skills/*` owns Codex-facing operating guidance.

## Framework Fit

Use Flue when the agent already fits the existing package-and-mount model:

- local repo/file/CLI context
- Cloudflare Worker deployment
- Cloudflare Durable Object state
- a small number of explicit runtime mounts

Use Eve when the agent needs Vercel-native agent infrastructure:

- filesystem-first agent directory
- durable workflows and resumable sessions
- managed sandbox and built-in file or shell tools
- channels such as Slack, Discord, Teams, web chat, API, cron, or Linear
- connections and provider-managed auth
- Vercel Build Output, Vercel Workflows, Vercel Sandbox, Agent Runs, or Vercel AI Gateway

Use an MCP server when the capability is reusable by other AI clients and should
not own model behavior.

Use a task runner when the behavior is deterministic file generation or
deployment plumbing.

## Selection Rules

1. If the work needs local files or local CLI tools, prefer a local Flue agent.
2. If the work is externally reachable, scheduled, shared, or always available
   but does not require managed sandbox or multi-channel delivery, prefer a
   Cloudflare Flue agent.
3. If the work needs durable workflow parking, managed sandbox, multi-channel
   delivery, Vercel-native auth/connections, or Vercel dashboard observability,
   prefer a Vercel Eve agent.
4. If the work is reusable protocol surface, prefer MCP.
5. If the work is deterministic scaffolding, prefer `scripts/*`.

## Eve Support Path

Do not make `agents/*` depend directly on Eve-only filesystem conventions.
Instead, add deterministic generation from a framework-neutral plan into an Eve
directory.

Recommended shape:

```text
packages/agent-catalog/
  runtime/framework/target detection and recommendation
packages/agent-plan/
  framework-neutral agent plan types
scripts/create-agent.ts
  create Flue packages or Eve directories from the plan
runtimes/vercel-eve/
  Vercel/Eve app shell, deploy scripts, and generated agent directories
```

The first deployable Eve runtime should verify:

```sh
bun --cwd runtimes/vercel-eve run build
bun --cwd runtimes/vercel-eve run check
vercel deploy
curl https://<app>/eve/v1/health
```

Production deploys should also smoke-test session creation and streaming.
