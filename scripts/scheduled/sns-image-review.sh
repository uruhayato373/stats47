#!/bin/bash
# SNS 投稿画像の週次確認 (ローカル Mac 限定 — X / Threads の画像はこの Mac の .local/r2/sns/ にしか無く CI で読めないため)。
# launchd から毎週日曜 07:30 に発火。スリープ中に時刻が来た回は起きたときに 1 回実行される。
# 次の 8 日間に予約・下書きがある投稿の画像と本文を、機械検査 + Claude (読み取り専用) で確認し、
# 結果を .local/sns-review/ に置いて sns-review-alert Issue を更新する (git と R2 は触らない)。
# 正典: .claude/rules/sns-content-standards.md §5.6
source "$(dirname "$0")/_common.sh"

rc=0
log_run sns-image-review npx tsx .claude/scripts/sns/review-sns-images.ts --issue || rc=$?

if [ "$rc" -eq 3 ]; then
  osascript -e 'display notification "予約中の SNS 投稿画像に確認が必要な指摘があります (GitHub Issue: sns-review-alert)" with title "stats47"' || true
  exit 0
elif [ "$rc" -ne 0 ]; then
  osascript -e 'display notification "SNS 投稿画像の週次確認に失敗しました。ログ: ~/Library/Logs/stats47/sns-image-review.log" with title "stats47"' || true
  exit 1
fi
