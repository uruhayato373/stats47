#!/usr/bin/env bash
# Compatibility entry point; remove when scheduled callers use the Node CLI directly.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
exec node "$ROOT/.claude/scripts/note/fetch-note-metrics.mjs" "$@"
