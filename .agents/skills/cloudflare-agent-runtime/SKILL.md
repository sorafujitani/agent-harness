---
name: cloudflare-agent-runtime
description: Use when changing, deploying, or debugging the Cloudflare runtime in this repository, including Wrangler, Durable Object migrations, Cloudflare API MCP, secrets, and Flue Cloudflare builds.
---

# Cloudflare Agent Runtime

Use this skill for `runtimes/cloudflare`, Cloudflare deploys, Durable Object migrations, and Cloudflare MCP operations.

## Sources And Tools

- Prefer repo files first: `runtimes/cloudflare/package.json`, `runtimes/cloudflare/wrangler.jsonc`, `DEVELOPMENT.md`.
- Use `wrangler` for local Worker and deploy commands.
- Use Cloudflare API MCP for account/platform operations when available.
- If Cloudflare behavior is unclear, check current Cloudflare docs before editing.

## Workflow

1. Inspect `runtimes/cloudflare/wrangler.jsonc`.
2. Inspect generated Flue build output only after running build.
3. Run:

```sh
bun --cwd runtimes/cloudflare run build
```

4. If Flue reports a new Durable Object class:
   - before first deployment, it may be added to `v1`;
   - after deployment, append a new migration tag;
   - never edit an already-applied migration.
5. Validate:

```sh
bun run typecheck
bun run check
bun run build
```

6. Deploy only when explicitly requested:

```sh
bun run runtime:cf:deploy
```

## Cloudflare API MCP

The repo config defines `cloudflare-api` as a remote MCP server. If it is not authorized, ask the user to run:

```sh
codex mcp login cloudflare-api
```

Use prompt approval for MCP actions that can mutate the Cloudflare account.

## Secrets

- Do not commit secrets.
- Prefer Cloudflare-managed secrets for deployed runtime credentials.
- Keep local-only credentials in `.env` or `.dev.vars`.
