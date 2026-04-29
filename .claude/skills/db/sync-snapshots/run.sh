#!/usr/bin/env bash
# sync-snapshots: ローカル D1 から全 R2 snapshot を順次 export する
# Phase 0-6 で R2 化した 13 種類の snapshot を 1 コマンドで更新

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)/.."
cd "$PROJECT_ROOT"

# Args
ONLY=""
DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) ONLY="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# Setup CLI で server-only バイパス + .env.local ロード
TSX="npx tsx -r ./packages/ranking/src/scripts/setup-cli.js"

# (label, script_path) のペアで定義
declare -a TASKS=(
  "master|packages/ranking/src/scripts/export-master-snapshots.ts"
  "ai-content|packages/ai-content/src/scripts/export-snapshot.ts"
  "correlation|packages/correlation/src/scripts/export-snapshot.ts"
  "area-profile|packages/area-profile/src/scripts/export-snapshot.ts"
  "blog|apps/web/scripts/export-blog-snapshot.ts"
  "page-components|apps/web/scripts/export-page-components-snapshot.ts"
  "affiliate-ads|apps/web/scripts/export-affiliate-ads-snapshot.ts"
  "ranking-page-cards|apps/web/scripts/export-ranking-page-cards-snapshot.ts"
  "fishing-ports|apps/web/scripts/export-fishing-ports-snapshot.ts"
  "port-statistics|apps/web/scripts/export-port-statistics-snapshot.ts"
)

# ranking-values は重いので SKIP_VALUES で制御
if [ -z "$SKIP_VALUES" ] || [ "$SKIP_VALUES" = "0" ]; then
  TASKS+=("ranking-values|packages/ranking/src/scripts/export-ranking-values-snapshots.ts")
fi

run_task() {
  local label="$1"
  local script="$2"

  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] $label → $TSX $script"
    return 0
  fi

  echo ""
  echo "═══ $label ═══"
  if eval "$TSX $script"; then
    echo "✅ $label 完了"
  else
    echo "❌ $label 失敗"
    return 1
  fi
}

FAILED=()
for task in "${TASKS[@]}"; do
  label="${task%|*}"
  script="${task##*|}"

  if [ -n "$ONLY" ] && [ "$ONLY" != "$label" ]; then
    continue
  fi

  if ! run_task "$label" "$script"; then
    FAILED+=("$label")
  fi
done

echo ""
echo "════════════════════════════════════════"
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "✅ 全 snapshot を R2 に push 完了"
else
  echo "❌ 失敗: ${FAILED[*]}"
  exit 1
fi
