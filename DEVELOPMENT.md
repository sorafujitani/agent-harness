# Development

This repository is organized around agents first. Runtimes are deployment
targets that mount selected agents.

## Environment

Use the flake shell:

```sh
nix develop
```

If direnv is enabled:

```sh
direnv allow .
```

Install JavaScript dependencies:

```sh
bun install
```

Authorize the project-scoped Cloudflare MCP server when Cloudflare account
operations are needed:

```sh
codex mcp login cloudflare-api
```

## Layout

```text
agents/
  hello/              # One workspace per Flue agent
mcps/
  agent-catalog/      # MCP server for reusable agent catalog tools/resources/prompts
  memoli/             # MCP wrapper for the memoli CLI/task/memo tool
runtimes/
  node/               # Local Flue runtime using the Node target
  cloudflare/         # Cloudflare Flue runtime
packages/
  agent-catalog/      # Shared repo catalog used by MCP servers and agents
  memoli/             # Markdown memo/task CLI and shared memoli implementation
.agents/skills/       # Repo-scoped Codex skills
.codex/config.toml    # Project-local Codex MCP config
docs/                 # Agent/resource notes
```

An agent package owns agent behavior. A runtime package decides which agents are
available in that runtime by re-exporting them from `src/agents`.

MCP servers live under `mcps/`. They expose reusable tools, resources, and
prompts to Codex, Flue agents, and other MCP clients. Deterministic repo reads
and writes should live in `packages/` or `scripts/` instead of being embedded
directly in an MCP handler.

## Codex Resources

Use these repo-scoped skills when asking Codex to work here:

- `$agent-surface-decider`: choose one-shot task, generator, skill, local runtime, or Cloudflare runtime.
- `$agent-design`: design a new Flue agent before scaffolding.
- `$agent-scaffold-review`: review a generated or modified agent scaffold.
- `$cloudflare-agent-runtime`: change, debug, or deploy the Cloudflare runtime.
- `$harness-executor`: manually execute a prompt through infrastructure
  selection, implementation, review, verification, and authorized deployment.

For Vercel Eve support, keep the agent's intent separate from the framework and
deployment target. Use `docs/runtime-layering.md` before adding a new Eve
runtime or generator path.

The Cloudflare API MCP server is configured in `.codex/config.toml`. It uses
OAuth and prompt approval for account-affecting actions. Use Wrangler for local
Worker commands and deploys.

## Common Commands

```sh
bun run typecheck
bun run check
bun run test
bun run build
bun run agent:new --help
bun run mcp:agent-catalog
bun run mcp:memoli
bun run memoli -- --help
```

Run local runtimes:

```sh
bun run runtime:local
bun run runtime:cf
```

Run the local agent catalog MCP server over stdio:

```sh
bun run mcp:agent-catalog
```

The project-local Codex config already registers this MCP server as
`agent-catalog`.

Run the local memoli MCP server over stdio:

```sh
bun run mcp:memoli
```

The project-local Codex config registers this MCP server as `memoli`.

Run the migrated memoli CLI:

```sh
bun run memoli -- init
bun run memoli -- task --help
```

Check and build memoli release artifacts through GoReleaser:

```sh
bunx vp run memoli:prod-build
bunx vp run memoli:install-local
bun run memoli:release:check
bun run memoli:release:snapshot
```

See `docs/memoli-homebrew.md` for the tap publish flow.

## Add An Agent

Use the generator:

```sh
bun run agent:new my-agent
```

By default, this creates `agents/my-agent` and mounts it in every runtime under
`runtimes/`.

Create and mount only in one runtime:

```sh
bun run agent:new my-agent --runtime cloudflare
```

Create only the agent package:

```sh
bun run agent:new my-agent --no-runtime
```

Preview changes without writing files:

```sh
bun run agent:new my-agent --dry-run
```

The generator writes:

- `agents/<name>/package.json`
- `agents/<name>/tsconfig.json`
- `agents/<name>/src/index.ts`
- `agents/<name>/src/index.test.ts`
- `runtimes/<runtime>/src/agents/<name>.ts`
- runtime package dependencies

If the agent is mounted in Cloudflare, the generator also appends a new Durable
Object migration tag in `runtimes/cloudflare/wrangler.jsonc`.

After generation:

```sh
bun install
bun run build
```

## Mount An Existing Agent In A Runtime

The generator is for new agents. To mount an existing agent in another runtime,
add `runtimes/<runtime>/src/agents/<name>.ts`:

```ts
export { default } from '@agent-harness/agent-my-agent';
```

Then add the workspace dependency to `runtimes/<runtime>/package.json`:

```json
"@agent-harness/agent-my-agent": "workspace:*"
```

Run install again after changing workspace dependencies:

```sh
bun install
```

## Validate

Before deploying:

```sh
bun run typecheck
bun run check
bun run test
bun run build
```

`bun run build` runs the agent package builds and the Flue builds for each
runtime.

## Add MCP Tools

Use MCP when a capability should be shared by Codex, Flue agents, and other MCP
clients. Put shared repo logic in `packages/` first, then expose it from an MCP
server under `mcps/`.

Current MCP server:

```text
mcps/agent-catalog
mcps/memoli
```

It exposes:

- `list_agents`: summarize Flue agents, runtime mounts, and Cloudflare bindings.
- `inspect_agent`: inspect one agent package and its mounted runtimes.
- `recommend_surface`: choose Codex, task runner, Agent Skill, Flue agent, or MCP server.
- `agent-catalog://catalog`: JSON resource with the current repo catalog.
- `design_agent`: prompt template for planning a new agent surface.

`mcps/memoli` exposes the migrated memoli tools:

- task tools: `task_add`, `task_list`, `task_get`, `task_update`, `task_remove`, `task_tree`
- memo/daily tools: `daily_read`, `memo_read`, `memo_list`

Smoke test the MCP server through the SDK client:

```sh
bun --cwd mcps/agent-catalog --eval '
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: "bun", args: ["run", "stdio"] });
const client = new Client({ name: "smoke", version: "0.0.0" });
await client.connect(transport);
console.log(await client.listTools());
await client.close();
'
```

Smoke test memoli MCP with a raw JSON-RPC message:

```sh
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' |
  bun run --silent --cwd mcps/memoli stdio
```

## Cloudflare Deployment

Build the Cloudflare runtime:

```sh
bun --cwd runtimes/cloudflare run build
```

If the Flue build reports a new Durable Object class, add it to
`runtimes/cloudflare/wrangler.jsonc`. `bun run agent:new` does this
automatically when the agent is mounted in the Cloudflare runtime.

For the first deployment, add the class to the first migration:

```jsonc
"migrations": [
  {
    "tag": "v1",
    "new_sqlite_classes": ["FlueHelloAgent", "FlueMyAgentAgent", "FlueRegistry"],
  },
]
```

After a runtime has already been deployed, do not edit an existing migration.
Append a new migration tag instead:

```jsonc
"migrations": [
  {
    "tag": "v1",
    "new_sqlite_classes": ["FlueHelloAgent", "FlueRegistry"],
  },
  {
    "tag": "v2",
    "new_sqlite_classes": ["FlueMyAgentAgent"],
  },
]
```

Deploy:

```sh
bun --cwd runtimes/cloudflare run deploy
```

## Notes

- Type checking uses `tsgo` from `@typescript/native-preview`.
- `typescript@rc` remains installed for editor and ecosystem compatibility.
- Keep provider secrets in `.env` or Cloudflare secrets. Do not commit them.
