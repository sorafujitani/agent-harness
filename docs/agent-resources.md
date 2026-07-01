# Agent Resources

This repo uses three resource layers.

## Codex Resources

- `AGENTS.md`: repo-wide instructions and verification commands.
- `.agents/skills/*`: repo-scoped Codex skills for agent design, review, runtime selection, and deployment work.
- `.codex/config.toml`: project-local Codex MCP configuration.

## Runtime Resources

- `agents/*`: Flue agent packages.
- `runtimes/node`: local runtime using Flue's Node target.
- `runtimes/cloudflare`: Cloudflare runtime using Flue's Cloudflare target.
- `runtimes/vercel`: Vercel runtime using Eve.
- `runtimes/cloudflare/wrangler.jsonc`: Cloudflare Worker configuration and Durable Object migrations.

## Cloudflare MCP

The project config includes:

```toml
[mcp_servers.cloudflare-api]
url = "https://mcp.cloudflare.com/mcp"
enabled = true
required = false
default_tools_approval_mode = "prompt"
tool_timeout_sec = 120
```

Authorize it once per Codex environment:

```sh
codex mcp login cloudflare-api
```

Use Cloudflare MCP for platform/account operations. Use Wrangler for local Worker development and deploy commands.

## Recommended Flow

1. Use `agent-surface-decider` to decide where behavior belongs.
2. Use `agent-design` to define a new Flue agent, or `harness-executor` for end-to-end surface selection.
3. Use `bun run agent:new` for deterministic scaffolding.
4. Use `agent-scaffold-review` before merging.
5. Use `cloudflare-agent-runtime` before Cloudflare deploys or migration changes.
