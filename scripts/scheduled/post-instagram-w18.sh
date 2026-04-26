#!/bin/bash
# launchd 用 IG 予約投稿ラッパー (W18 用)
# 毎日 09:00 JST に発火し、.claude/state/instagram-w18-schedule.json から今日分を読んで投稿。
# 該当日付なし → 黙って exit 0（その日は投稿なし）。

source "$(dirname "$0")/_common.sh"

SCHEDULE_FILE="$PROJECT_DIR/.claude/state/instagram-w18-schedule.json"
TODAY=$(TZ=Asia/Tokyo date +%Y-%m-%d)

if [ ! -f "$SCHEDULE_FILE" ]; then
  echo "[post-instagram-w18] schedule file not found: $SCHEDULE_FILE"
  exit 0
fi

ENTRY=$(jq -c --arg date "$TODAY" '.[] | select(.date==$date)' "$SCHEDULE_FILE" 2>/dev/null)

if [ -z "$ENTRY" ]; then
  echo "[post-instagram-w18] $TODAY: 投稿予定なし、skip"
  exit 0
fi

KEY=$(echo "$ENTRY" | jq -r '.content_key')
DOMAIN=$(echo "$ENTRY" | jq -r '.domain')
TYPE=$(echo "$ENTRY" | jq -r '.type')
NOTE=$(echo "$ENTRY" | jq -r '.note // ""')

echo "[post-instagram-w18] $TODAY: posting $KEY ($DOMAIN/$TYPE) — $NOTE"

log_run "post-instagram-w18" \
  /opt/homebrew/opt/node@20/bin/npx tsx \
  "$PROJECT_DIR/.claude/skills/sns/post-instagram/post-instagram.ts" \
  "$KEY" --domain "$DOMAIN" --type "$TYPE"
