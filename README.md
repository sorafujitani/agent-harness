# agent-harness

Flue agents managed in a Bun + TypeScript 7 monorepo.

## Requirements

Use the Nix shell for a reproducible local environment:

```sh
nix develop
```

The shell provides Node.js 24, Bun, and the supporting CLI tools used by this
repo. JavaScript dependencies are still locked by `bun.lock`.

## Setup

```sh
bun install
```

Copy `.env.example` to `.env` and set the provider credentials required by the
model you choose.

## Commands

```sh
bun run check
bun run test
bun run build
bun run runtime:local
bun run runtime:cf
```

## Layout

- `agents/*`: one workspace per agent.
- `runtimes/node`: local Node.js Flue target that mounts selected agents.
- `runtimes/cloudflare`: Cloudflare Flue target that mounts selected agents.
- `packages/*`: shared libraries that are not agents.

## Adding agents

Create a new workspace under `agents/<name>` and export a default Flue agent
from `src/index.ts`. To expose it through a runtime, add
`runtimes/<runtime>/src/agents/<name>.ts` that re-exports the agent package.
