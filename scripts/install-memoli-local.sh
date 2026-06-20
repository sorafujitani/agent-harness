#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
install_dir="${MEMOLI_INSTALL_DIR:-$HOME/.local/bin}"
dist_dir="$repo_root/dist/goreleaser"

cd "$repo_root"

scripts/build-memoli-local.sh

memoli_binary="$(find "$dist_dir" -type f -path '*/memoli' | sort | head -n 1)"
memoli_mcp_binary="$(find "$dist_dir" -type f -path '*/memoli-mcp' | sort | head -n 1)"

if [[ -z "$memoli_binary" || -z "$memoli_mcp_binary" ]]; then
  echo "memoli binaries were not found under $dist_dir" >&2
  exit 1
fi

install -d "$install_dir"
install -m 0755 "$memoli_binary" "$install_dir/memoli"
install -m 0755 "$memoli_mcp_binary" "$install_dir/memoli-mcp"

if [[ "$(uname -s)" == "Darwin" ]]; then
  xattr -dr com.apple.quarantine "$install_dir/memoli" "$install_dir/memoli-mcp" 2>/dev/null || true
fi

echo "Installed:"
echo "  $install_dir/memoli"
echo "  $install_dir/memoli-mcp"

"$install_dir/memoli" --version

case ":$PATH:" in
  *":$install_dir:"*) ;;
  *)
    echo "warning: $install_dir is not in PATH" >&2
    ;;
esac
