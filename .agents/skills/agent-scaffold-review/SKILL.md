---
name: agent-scaffold-review
description: Use when reviewing a new or modified agent scaffold in this repository for workspace shape, runtime mounts, migration updates, and verification gaps.
---

# Agent Scaffold Review

Use this skill after `bun run agent:new` or when reviewing changes under `agents/*` and `runtimes/*`.

## Checklist

- Agent workspace exists at `agents/<name>`.
- Package name is `@agent-harness/agent-<name>`.
- `src/index.ts` default-exports a Flue agent.
- `tsconfig.json` extends `../../tsconfig.base.json`.
- Runtime mount files exist only for intended runtimes.
- Runtime package dependencies include the agent package.
- Cloudflare-mounted agents have Durable Object migrations covered in `runtimes/cloudflare/wrangler.jsonc`.
- Eve runtime-owned agents live under `runtimes/vercel/agent` and are not mounted through `src/agents`.
- No secrets are committed.

## Verification

Run:

```sh
bun install
bun run typecheck
bun run check
bun run test
bun run build
```

Report findings first. Include exact file paths and commands that failed.
