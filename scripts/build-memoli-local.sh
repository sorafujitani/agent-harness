#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

detect_target() {
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) echo "bun-darwin-arm64" ;;
    Darwin-x86_64) echo "bun-darwin-x64" ;;
    Linux-aarch64 | Linux-arm64) echo "bun-linux-arm64" ;;
    Linux-x86_64) echo "bun-linux-x64-baseline" ;;
    *)
      echo "unsupported platform: $(uname -s)-$(uname -m)" >&2
      return 1
      ;;
  esac
}

export TARGET="${TARGET:-$(detect_target)}"

if ! goreleaser build --snapshot --clean --single-target --config .goreleaser.yaml; then
  echo "warning: GoReleaser build failed; rebuilding local binaries directly with bun" >&2
fi

ensure_binary() {
  local id="$1"
  local main="$2"
  local outfile="dist/goreleaser/${id}_${TARGET}/${id}"

  if [[ -f "$outfile" ]]; then
    return
  fi

  echo "warning: $outfile was not produced by GoReleaser; rebuilding with bun" >&2
  mkdir -p "$(dirname "$outfile")"
  bun build --compile --minify --target "$TARGET" --outfile "$outfile" "$main"
}

ensure_binary memoli packages/memoli/src/cli.ts
ensure_binary memoli-mcp mcps/memoli/src/stdio.ts
