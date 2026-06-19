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

Authorize Cloudflare MCP when you need account/platform operations:

```sh
codex mcp login cloudflare-api
```

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
- `.agents/skills/*`: repo-scoped Codex skills.
- `.codex/config.toml`: project-local Codex MCP config.
- `docs/agent-resources.md`: resource map for Codex, skills, runtimes, and Cloudflare MCP.

## Adding agents

Use the generator:

```sh
bun run agent:new my-agent
```

See `DEVELOPMENT.md` and `docs/agent-resources.md` for the full workflow.
