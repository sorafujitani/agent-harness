---
name: agent-design
description: Use when designing a new Flue agent for this repository, including name, runtime placement, instructions, tools, state, deployment target, and tests.
---

# Agent Design

Use this skill before running `bun run agent:new` or manually editing `agents/*`.

## Workflow

1. Define the agent's job in one sentence.
2. Choose runtime placement:
   - `local` when it needs local repo/files/tools.
   - `cf` when it must be externally reachable, scheduled, webhook-driven, shared, or always available.
   - both only when the same behavior is useful locally and in production.
3. Choose state:
   - stateless for simple request/response tasks.
   - Durable Object-backed state for Cloudflare sessions, schedules, or coordination.
4. Draft `instructions` as operational behavior, not marketing copy.
5. Add one test that proves the agent module exports a Flue agent.
6. Run:

```sh
bun run agent:new <agent-name> --runtime <node|cloudflare>
bun install
bun run typecheck
bun run check
bun run build
```

## Naming

- Agent directory names are kebab-case under `agents/<name>`.
- Package names use `@agent-harness/agent-<name>`.
- Runtime mount files use `runtimes/<runtime>/src/agents/<name>.ts`.

## Avoid

- Do not put deterministic scaffold logic in the agent itself; use scripts/generators.
- Do not deploy to Cloudflare only because it is possible. Use Cloudflare when external availability or durable platform resources matter.
