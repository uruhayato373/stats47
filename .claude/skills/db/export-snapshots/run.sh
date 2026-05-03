#!/usr/bin/env bash
# export-snapshots: ローカル D1 から R2 snapshot を一括 export する
# 設定は snapshots.config.json を参照（追加・削除はそちらを編集）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)/.."
CONFIG="$SCRIPT_DIR/snapshots.config.json"
cd "$PROJECT_ROOT"

if [ ! -f "$CONFIG" ]; then
  echo "❌ 設定ファイルが見つかりません: $CONFIG"
  exit 1
fi

ONLY=""
DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) ONLY="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

TSX="npx tsx -r ./packages/ranking/src/scripts/setup-cli.js"

# JSON config から (label|script|skipBy) のレコードを抽出
# macOS bash 3.2 互換のため mapfile を使わず while-read 方式
ENTRIES=()
while IFS= read -r line; do
  ENTRIES+=("$line")
done < <(node -e "
  const cfg = require('$CONFIG');
  for (const s of cfg.snapshots) {
    process.stdout.write(\`\${s.label}|\${s.script}|\${s.skipBy ?? ''}\n\`);
  }
")

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
for entry in "${ENTRIES[@]}"; do
  IFS='|' read -r label script skipBy <<< "$entry"

  if [ -n "$ONLY" ] && [ "$ONLY" != "$label" ]; then
    continue
  fi

  # skipBy が設定されていて、その環境変数が truthy なら skip
  if [ -n "$skipBy" ]; then
    skipVal="${!skipBy:-}"
    if [ -n "$skipVal" ] && [ "$skipVal" != "0" ]; then
      echo "⏭  $label skipped ($skipBy=$skipVal)"
      continue
    fi
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
