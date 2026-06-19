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

## Layout

```text
agents/
  hello/              # One workspace per agent
runtimes/
  node/               # Local Flue runtime using the Node target
  cloudflare/         # Cloudflare Flue runtime
packages/             # Shared libraries that are not agents
```

An agent package owns agent behavior. A runtime package decides which agents are
available in that runtime by re-exporting them from `src/agents`.

## Common Commands

```sh
bun run typecheck
bun run check
bun run test
bun run build
bun run agent:new --help
```

Run local runtimes:

```sh
bun run runtime:local
bun run runtime:cf
```

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
