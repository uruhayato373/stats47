#!/usr/bin/env bash
# AI コンテンツ一括生成スクリプト
# 別ターミナルで実行可能:
#   cd stats47 && bash packages/ai-content/src/scripts/generate-all.sh
#
# オプション:
#   --model claude|gemini   使用するAIモデル (default: claude)
#   --concurrency N         並列数 (default: 5、並列モード時のみ有効)
#   --limit N               処理件数上限
#   --force                 既存レコードも再生成
#   --dry-run               生成せずに対象一覧のみ表示
#   --sequential            逐次処理（並列なし、Gemini デフォルト動作）
#
# 例:
#   bash generate-all.sh --model claude --concurrency 5
#   bash generate-all.sh --model gemini --sequential
#   bash generate-all.sh --model claude --limit 50

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

MODEL="claude"
CONCURRENCY=5
LIMIT_FLAG=""
FORCE_FLAG=""
DRY_RUN=false
SEQUENTIAL=false

for arg in "$@"; do
  case "$arg" in
    --force) FORCE_FLAG="--force" ;;
    --dry-run) DRY_RUN=true ;;
    --sequential) SEQUENTIAL=true ;;
    --model) ;;
    --concurrency) ;;
    --limit) ;;
  esac
done

# 値付き引数のパース
i=0
args=("$@")
while [ $i -lt ${#args[@]} ]; do
  case "${args[$i]}" in
    --model)       i=$((i+1)); MODEL="${args[$i]}" ;;
    --concurrency) i=$((i+1)); CONCURRENCY="${args[$i]}" ;;
    --limit)       i=$((i+1)); LIMIT_FLAG="--limit ${args[$i]}" ;;
  esac
  i=$((i+1))
done

run_tsx() {
  NODE_ENV=development NODE_OPTIONS='--conditions react-server' npx tsx "$@"
}

# ============================================================
# 並列モード（デフォルト）: generate-parallel.ts に委譲
# ============================================================
if [ "$SEQUENTIAL" = false ]; then
  if [ "$DRY_RUN" = true ]; then
    echo "=== Dry-run (pending list) ==="
    run_tsx packages/ai-content/src/scripts/list-pending.ts $FORCE_FLAG 2>/dev/null | \
      grep -v '^\[' | grep -v '^$' | \
      python3 -c "import json,sys; d=json.load(sys.stdin); [print(f\"{i['rankingKey']}\t{i['rankingName']}\") for i in d['items']]"
    exit 0
  fi

  exec run_tsx packages/ai-content/src/scripts/generate-parallel.ts \
    --model "$MODEL" \
    --concurrency "$CONCURRENCY" \
    $LIMIT_FLAG \
    $FORCE_FLAG
fi

# ============================================================
# 逐次モード（--sequential）: 旧来の Gemini 逐次処理
# ============================================================

# stdout からログ行を除去して JSON だけ抽出する
extract_json() {
  grep -v '^\[' | grep -v '^$'
}

echo "=== Fetching pending list... (sequential, model: $MODEL) ==="
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

SUCCESS=0
FAIL=0
KEYS=$(echo "$PENDING_JSON" | jq -r '.items[].rankingKey')

for KEY in $KEYS; do
  NAME=$(echo "$PENDING_JSON" | jq -r --arg k "$KEY" '.items[] | select(.rankingKey == $k) | .rankingName')
  echo ""
  echo "--- [$((SUCCESS + FAIL + 1))/$PENDING] $KEY: $NAME ---"

  PROMPT_JSON=$(run_tsx packages/ai-content/src/scripts/build-prompt.ts --key "$KEY" | extract_json) || {
    echo "[SKIP] build-prompt failed for $KEY"
    FAIL=$((FAIL + 1))
    continue
  }

  YEAR=$(echo "$PROMPT_JSON" | jq -r '.yearCode')
  PROMPT_FILE="/tmp/ai-content-prompt-${KEY}.txt"
  OUTPUT_FILE="/tmp/ai-content-output-${KEY}.json"

  echo "$PROMPT_JSON" | jq -r '.prompt' > "$PROMPT_FILE"

  if [ "$MODEL" = "claude" ]; then
    if ! claude -p "" --output-format text < "$PROMPT_FILE" > "$OUTPUT_FILE" 2>/tmp/ai-content-err-${KEY}.log; then
      echo "[FAIL] Claude CLI error for $KEY"
      FAIL=$((FAIL + 1))
      continue
    fi
  else
    if ! gemini -p "" -o text < "$PROMPT_FILE" > "$OUTPUT_FILE" 2>/tmp/ai-content-err-${KEY}.log; then
      echo "[FAIL] Gemini CLI error for $KEY"
      FAIL=$((FAIL + 1))
      continue
    fi
  fi

  if ! cat "$OUTPUT_FILE" | run_tsx packages/ai-content/src/scripts/save-content.ts --key "$KEY" --year "$YEAR" --model "$MODEL"; then
    echo "[FAIL] save-content failed for $KEY"
    FAIL=$((FAIL + 1))
    continue
  fi

  SUCCESS=$((SUCCESS + 1))
  rm -f "$PROMPT_FILE" "$OUTPUT_FILE" "/tmp/ai-content-err-${KEY}.log"
done

echo ""
echo "=== Done ==="
echo "Success: $SUCCESS"
echo "Failed:  $FAIL"
echo "Total:   $PENDING"
