#!/bin/bash
# AI コンテンツ一括生成バッチ
# Usage: bash scripts/batch-generate-ai-content.sh
#
# 中断しても再開可能（生成済みはスキップされる）

cd /Users/minamidaisuke/stats47

LOG_FILE="scripts/batch-ai-content.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') === AI Content Batch Start ===" | tee -a "$LOG_FILE"

# /tmp/ai-content-keys.txt は事前に生成済み（key|year の1行1レコード）
if [ ! -f /tmp/ai-content-keys.txt ]; then
  echo "ERROR: /tmp/ai-content-keys.txt not found. Run list-pending first." | tee -a "$LOG_FILE"
  exit 1
fi

TOTAL=$(wc -l < /tmp/ai-content-keys.txt | tr -d ' ')
echo "Pending: $TOTAL items" | tee -a "$LOG_FILE"

OK=0
FAIL=0
SKIP=0
IDX=0

while IFS='|' read -r KEY YEAR; do
  IDX=$((IDX + 1))

  if [ -z "$KEY" ] || [ -z "$YEAR" ]; then
    SKIP=$((SKIP + 1))
    echo "[$IDX/$TOTAL] SKIP $KEY — no yearCode" | tee -a "$LOG_FILE"
    continue
  fi

  echo -n "[$IDX/$TOTAL] $KEY ($YEAR) ... " | tee -a "$LOG_FILE"

  # a. プロンプト生成（stderr はログに出るので /dev/null、stdoutからJSON抽出）
  PROMPT_FILE="/tmp/ai-content-prompt.txt"
  NODE_ENV=development NODE_OPTIONS='--conditions react-server' npx tsx packages/ai-content/src/scripts/build-prompt.ts --key "$KEY" 2>/dev/null \
    | grep -v '^\[' \
    | node -e "
      let b='';process.stdin.on('data',c=>b+=c);
      process.stdin.on('end',()=>{
        try{const d=JSON.parse(b);process.stdout.write(d.prompt||'');}catch(e){}
      });
    " > "$PROMPT_FILE" 2>/dev/null || true

  if [ ! -s "$PROMPT_FILE" ]; then
    echo "FAIL (empty prompt)" | tee -a "$LOG_FILE"
    FAIL=$((FAIL + 1))
    continue
  fi

  # b. Gemini CLI で生成
  OUTPUT_FILE="/tmp/ai-content-output.json"
  if ! cat "$PROMPT_FILE" | gemini -p "" -o text > "$OUTPUT_FILE" 2>/dev/null; then
    echo "FAIL (gemini)" | tee -a "$LOG_FILE"
    FAIL=$((FAIL + 1))
    continue
  fi

  # c. DB に保存（ログ出力が exit code に影響するため出力で判定）
  SAVE_OUT=$(cat "$OUTPUT_FILE" | NODE_ENV=development NODE_OPTIONS='--conditions react-server' npx tsx packages/ai-content/src/scripts/save-content.ts --key "$KEY" --year "$YEAR" 2>&1 || true)
  if echo "$SAVE_OUT" | grep -q '\[OK\]'; then
    echo "OK" | tee -a "$LOG_FILE"
    OK=$((OK + 1))
  else
    echo "FAIL (save)" | tee -a "$LOG_FILE"
    FAIL=$((FAIL + 1))
  fi

done < /tmp/ai-content-keys.txt

echo "" | tee -a "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') === Batch Complete ===" | tee -a "$LOG_FILE"
echo "OK: $OK / FAIL: $FAIL / SKIP: $SKIP" | tee -a "$LOG_FILE"
