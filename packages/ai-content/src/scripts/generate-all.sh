#!/usr/bin/env bash
# AI コンテンツ一括生成スクリプト（Gemini CLI）
# 別ターミナルで実行可能:
#   cd stats47 && bash packages/ai-content/src/scripts/generate-all.sh
#
# オプション:
#   --force    既存レコードも再生成
#   --dry-run  生成せずに対象一覧のみ表示

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

FORCE_FLAG=""
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --force) FORCE_FLAG="--force" ;;
    --dry-run) DRY_RUN=true ;;
  esac
done

# stdout からログ行を除去して JSON だけ抽出する
extract_json() {
  grep -v '^\[' | grep -v '^$'
}

run_tsx() {
  NODE_ENV=development NODE_OPTIONS='--conditions react-server' npx tsx "$@"
}

# 1. 対象一覧を取得
echo "=== Fetching pending list... ==="
PENDING_JSON=$(run_tsx packages/ai-content/src/scripts/list-pending.ts $FORCE_FLAG | extract_json)
TOTAL=$(echo "$PENDING_JSON" | jq -r '.total')
PENDING=$(echo "$PENDING_JSON" | jq -r '.pending')

echo "Total rankings: $TOTAL"
echo "Pending: $PENDING"

if [ "$PENDING" -eq 0 ]; then
  echo "All done. No pending items."
  exit 0
fi

if [ "$DRY_RUN" = true ]; then
  echo "$PENDING_JSON" | jq -r '.items[] | "\(.rankingKey)\t\(.rankingName)"'
  exit 0
fi

# 2. ループ処理
SUCCESS=0
FAIL=0
KEYS=$(echo "$PENDING_JSON" | jq -r '.items[].rankingKey')

for KEY in $KEYS; do
  NAME=$(echo "$PENDING_JSON" | jq -r --arg k "$KEY" '.items[] | select(.rankingKey == $k) | .rankingName')
  echo ""
  echo "--- [$((SUCCESS + FAIL + 1))/$PENDING] $KEY: $NAME ---"

  # a. プロンプト構築
  PROMPT_JSON=$(run_tsx packages/ai-content/src/scripts/build-prompt.ts --key "$KEY" | extract_json) || {
    echo "[SKIP] build-prompt failed for $KEY"
    FAIL=$((FAIL + 1))
    continue
  }

  YEAR=$(echo "$PROMPT_JSON" | jq -r '.yearCode')
  PROMPT_FILE="/tmp/ai-content-prompt-${KEY}.txt"
  OUTPUT_FILE="/tmp/ai-content-output-${KEY}.json"

  echo "$PROMPT_JSON" | jq -r '.prompt' > "$PROMPT_FILE"

  # b. Gemini CLI で生成
  if ! gemini -p "" -o text < "$PROMPT_FILE" > "$OUTPUT_FILE" 2>/tmp/ai-content-err-${KEY}.log; then
    echo "[FAIL] Gemini CLI error for $KEY"
    cat "/tmp/ai-content-err-${KEY}.log"
    FAIL=$((FAIL + 1))
    continue
  fi

  # c. DB 保存
  if ! cat "$OUTPUT_FILE" | run_tsx packages/ai-content/src/scripts/save-content.ts --key "$KEY" --year "$YEAR" --model gemini; then
    echo "[FAIL] save-content failed for $KEY"
    FAIL=$((FAIL + 1))
    continue
  fi

  SUCCESS=$((SUCCESS + 1))

  # tmp クリーンアップ
  rm -f "$PROMPT_FILE" "$OUTPUT_FILE" "/tmp/ai-content-err-${KEY}.log"
done

echo ""
echo "=== Done ==="
echo "Success: $SUCCESS"
echo "Failed:  $FAIL"
echo "Total:   $PENDING"
