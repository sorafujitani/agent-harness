# Memoli Homebrew Release

Memoli is released with GoReleaser's Bun builder. The Homebrew cask installs
two commands:

- `memoli`: CLI Markdown memo/task manager.
- `memoli-mcp`: stdio MCP server for memoli tools.

## Local Check

```sh
bun run memoli:release:check
```

## Local Production Install

Use this after changing memoli locally when you want the installed command to
match the production binary shape without publishing Homebrew:

```sh
bunx vp run memoli:install-local
```

This runs GoReleaser for the current platform and installs:

```text
~/.local/bin/memoli
~/.local/bin/memoli-mcp
```

Override the destination with `MEMOLI_INSTALL_DIR`:

```sh
MEMOLI_INSTALL_DIR="$HOME/bin" bunx vp run memoli:install-local
```

Build without installing:

```sh
bunx vp run memoli:prod-build
```

## Snapshot Release

```sh
bun run memoli:release:snapshot
```

This writes release artifacts under `dist/goreleaser/` without publishing.

## Publish Release

Tag releases with the memoli package version:

```sh
git tag v$(node -p "require('./packages/memoli/package.json').version")
git push origin v$(node -p "require('./packages/memoli/package.json').version")
```

The `memoli-release` GitHub workflow runs GoReleaser, creates the GitHub
release, and publishes the Homebrew cask to `sorafujitani/homebrew-tap`.

GoReleaser OSS expects SemVer tags like `v2.0.1`. Component-prefixed monorepo
tags like `memoli/v2.0.1` require GoReleaser Pro's `monorepo.tag_prefix` or a
separate release repository.

Configure this secret on GitHub before publishing:

```text
HOMEBREW_TAP_GITHUB_TOKEN
```

It needs contents write access to the tap repository. The default
`GITHUB_TOKEN` only has access to this repository.

## Install

```sh
brew tap sorafujitani/tap
brew install --cask memoli
memoli --version
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | memoli-mcp
```

## Codex MCP Config

After installing through Homebrew, Codex can use the MCP binary directly:

```toml
[mcp_servers.memoli]
command = "memoli-mcp"
enabled = true
required = false
tool_timeout_sec = 120
```
