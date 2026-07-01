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
bun run mcp:agent-catalog
bun run mcp:memoli
bun run memoli -- --help
bun run runtime:local
bun run runtime:cf
bun run runtime:vercel
```

## Layout

- `agents/*`: one workspace per agent.
- `mcps/*`: MCP servers that expose reusable tools, resources, and prompts.
- `runtimes/node`: local Node.js Flue target that mounts selected agents.
- `runtimes/cloudflare`: Cloudflare Flue target that mounts selected agents.
- `runtimes/vercel`: Vercel Eve runtime with its own filesystem-first agent.
- `packages/*`: shared libraries shared by agents, MCP servers, runtimes, and generators.
- `.agents/skills/*`: repo-scoped Codex skills.
- `.codex/config.toml`: project-local Codex MCP config.
- `docs/agent-resources.md`: resource map for Codex, skills, runtimes, and Cloudflare MCP.
- `docs/monorepo-structure.md`: ownership rules for Flue, MCP, and shared packages.

## Included tools

- `packages/memoli`: migrated memoli Markdown memo/task CLI.
- `mcps/memoli`: stdio MCP wrapper for memoli tools.
- `mcps/agent-catalog`: stdio MCP server for this repo's agent catalog.

## Memoli Homebrew

Memoli is released through GoReleaser as standalone Homebrew binaries:

```sh
bunx vp run memoli:prod-build
bunx vp run memoli:install-local
bun run memoli:release:check
bun run memoli:release:snapshot
```

See `docs/memoli-homebrew.md` for release, tap, install, and MCP config steps.

## Adding agents

Use the generator:

```sh
bun run agent:new my-agent
```

See `DEVELOPMENT.md` and `docs/agent-resources.md` for the full workflow.
