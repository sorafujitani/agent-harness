---
name: agent-surface-decider
description: Use when deciding whether work should be a one-shot Codex task, repo task runner, Codex Agent Skill, local Flue agent, or Cloudflare-deployed agent in this repository.
---

# Agent Surface Decider

Use this skill before adding a new agent, generator, skill, or Cloudflare runtime capability.

## Decision Rules

- **One-shot Codex task**: use when the request is situational and does not need a reusable artifact.
- **Task runner / generator**: use when the action must be deterministic, repeatable, and mostly non-reasoning, such as scaffolding files or updating package metadata.
- **Codex Agent Skill**: use when Codex should follow a reusable workflow, review checklist, or decision process while working in this repo.
- **Local Flue agent**: use when the agent benefits from local files, local repo state, or private machine context and does not need to run while the PC is closed.
- **Cloudflare Flue agent**: use when the agent must be reachable externally, run while local machines are offline, receive webhooks, serve multiple users, hold durable state, or use Cloudflare-managed secrets/runtime.

## Output

When asked to place new behavior, answer with:

1. Chosen surface.
2. Why it belongs there.
3. What not to put there.
4. Files or commands to change.
5. Verification commands.
