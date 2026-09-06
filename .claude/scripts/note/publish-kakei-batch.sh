#!/usr/bin/env bash
# 家計シリーズをまとめて公開する。1本ずつ逐次実行し、失敗しても止まらない。
# 連続投稿の spam 検知を避けるため記事間に 20-40 秒の待機を入れる。
ROOT=/Users/minamidaisuke/stats47
LOG="$ROOT/.local/kakei-publish-log.tsv"
mkdir -p "$(dirname "$LOG")"; touch "$LOG"
for SLUG in "$@"; do
  if grep -qP "^$SLUG\tOK" "$LOG" 2>/dev/null; then echo "== $SLUG already OK"; continue; fi
  echo "================ $SLUG  $(date +%H:%M:%S)"
  OUT=$(bash "$ROOT/.claude/scripts/note/publish-kakei-one.sh" "$SLUG" 2>&1)
  RC=$?
  echo "$OUT" | tail -12
  URL=$(echo "$OUT" | grep -oE 'https://note\.com/stats47/n/n[0-9a-f]+' | tail -1)
  if [ "$RC" -eq 0 ] && [ -n "$URL" ]; then
    printf '%s\tOK\t%s\n' "$SLUG" "$URL" >> "$LOG"
  elif [ "$RC" -eq 0 ]; then
    printf '%s\tSKIP\t-\n' "$SLUG" >> "$LOG"
  else
    printf '%s\tFAIL(rc=%s)\t%s\n' "$SLUG" "$RC" "$(echo "$OUT" | grep -E '^FAIL' | head -1)" >> "$LOG"
  fi
  W=$((20 + RANDOM % 21))
  echo "-- wait ${W}s"
  sleep "$W"
done
echo "=== LOG ==="; cat "$LOG"
