# Agent Harness Instructions

## Language

Respond in Japanese unless the user explicitly asks otherwise.

## Project Shape

- `agents/*`: one workspace per Flue agent.
- `runtimes/node`: local runtime using Flue's Node target.
- `runtimes/cloudflare`: Cloudflare runtime using Flue's Cloudflare target.
- `packages/*`: shared libraries that are not agents.
- `.agents/skills/*`: repo-scoped Codex skills for designing, reviewing, and deploying agents.

## Commands

Use the Nix shell when possible:

```sh
nix develop
```

Common checks:

```sh
bun install
bun run typecheck
bun run check
bun run test
bun run build
```

Runtime commands:

```sh
bun run runtime:local
bun run runtime:cf
bun run runtime:cf:deploy
```

Create an agent:

```sh
bun run agent:new <agent-name>
```

## Cloudflare

- Use Wrangler for local Worker/runtime commands.
- Use Cloudflare API MCP for account/platform operations when available.
- Treat Cloudflare API MCP actions as account-affecting; ask before destructive or production mutations.
- Do not edit existing Durable Object migrations after deploy. Add a new migration tag.

## Verification

Before saying a runtime or agent is ready, run at least:

```sh
bun run typecheck
bun run check
bun run build
```

For generator changes, also run:

```sh
bun run agent:new example-agent --dry-run
```
