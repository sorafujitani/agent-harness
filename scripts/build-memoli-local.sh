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

goreleaser build --snapshot --clean --single-target --config .goreleaser.yaml
