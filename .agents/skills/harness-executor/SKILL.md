---
name: harness-executor
description: Manual-only repo workflow for agent-harness. Use only when explicitly invoked as `$harness-executor` or when the user asks for the harness to take a prompt and choose infrastructure, implement, review, verify, and deploy an agent capability end to end.
---

# Harness Executor

Use this skill as the manual execution path for turning a user's desired agent
workflow into repo changes and deployment-ready output.

## Operating Rule

Treat the user's prompt as the source of truth. Do not replace it with a
paraphrase. Keep moving through implementation unless the prompt explicitly
limits scope, such as `調査だけ`, `まずは設計だけ`, `commitしない`, or `deployしない`.

## Workflow

1. Capture the prompt.
   - Restate the requested outcome in one sentence.
   - Extract constraints: target users, triggers, data/tools, state, runtime,
     privacy, deployment, and verification needs.
   - If a missing answer would cause an unsafe external mutation, ask only that
     question. Otherwise make a conservative assumption and proceed.
2. Inspect the repo.
   - Read `docs/runtime-layering.md`.
   - Read `packages/agent-catalog/src/index.ts` for current surface choices.
   - Check `git status --short` before editing and preserve unrelated changes.
3. Select the surface.
   - One-shot Codex task: situational, no durable repo artifact.
   - Task runner: deterministic scaffold, migration, package metadata, or deploy
     plumbing.
   - Codex Agent Skill: reusable Codex workflow, review checklist, or decision
     process.
   - MCP server: reusable tool/resource/prompt for multiple AI clients.
   - Local Flue agent: local repo/files/CLI/private machine context.
   - Cloudflare Flue agent: external, scheduled, webhook-driven, shared, or
     always-on workflow without Vercel-native sandbox/channel requirements.
   - Vercel Eve agent: durable workflow parking, managed sandbox, multi-channel
     delivery, Vercel Connect, Vercel Workflows, Vercel Sandbox, Agent Runs, or
     AI Gateway.
4. Plan the implementation boundary.
   - Keep agent intent separate from framework adapter, runtime target, and
     provider operations.
   - Put reusable deterministic logic in `packages/*`.
   - Put repeatable generation and deployment plumbing in `scripts/*`.
   - Put protocol surfaces in `mcps/*`.
   - Put repo operating guidance in `.agents/skills/*`.
   - Put runtime mounting, provider config, migrations, and deploy commands in
     `runtimes/*`.
5. Implement.
   - Follow existing patterns before adding abstractions.
   - Update docs when the workflow changes how future agents should work.
   - Do not commit secrets.
   - For Cloudflare Durable Object changes, add a new migration tag after any
     deployed migration; never edit an already-applied migration.
6. Review before reporting.
   - Inspect the actual diff, not only command success.
   - Check for scope creep, leaked secrets, missing tests, migration mistakes,
     generated artifact churn, and mismatched runtime/package dependencies.
   - Fix review findings before finalizing when practical.
7. Verify.
   - Run targeted tests for changed packages.
   - Before claiming readiness, run:

```sh
bun run typecheck
bun run check
bun run test
bun run build
```

- For generator changes, also run:

```sh
bun run agent:new example-agent --dry-run
```

8. Deploy when authorized.
   - Deploy only if the prompt explicitly requests deployment or the user
     approves it during the run.
   - Use the runtime's own deploy command.
   - For Cloudflare, prefer `bun run runtime:cf:deploy`.
   - For Vercel Eve, prefer `bun run runtime:vercel:deploy`.
   - After deploy, smoke-test the live endpoint, not only the build logs.

## Output

Report:

1. Chosen surface and why.
2. Files changed.
3. Review result.
4. Verification commands and results.
5. Deployment status or the exact remaining deploy step.
