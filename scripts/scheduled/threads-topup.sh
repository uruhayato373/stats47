#!/bin/bash
# Threads 予約の補充 (ローカル Mac 限定 — Threads にログインした Playwright プロファイルが .local にあるため)。
# launchd から 9:30 / 21:30 とログイン時に発火。詳細: .claude/skills/sns/publish-threads/SKILL.md
#
# Threads の予約は同時 25 件まで (約 12 日分)。空いた枠だけを台帳 posts.json の Threads 下書きから入れる。
# スリープ中に時刻が来た回は、次に Mac が起きたときに 1 回にまとめて実行される (man launchd.plist の
# StartCalendarInterval)。電源を切っていた場合は RunAtLoad でログイン時に実行される。
#
# git は触らない (並行セッションとの競合を避けるため)。予約済みは .local/threads-scheduled.jsonl に残り、
# 台帳への反映は `publish-threads.ts --sync-ledger` を人間 / agent がコミット時に行う。
source "$(dirname "$0")/_common.sh"

# 起きた直後はネットワークがまだ無いことがあるので最大 3 分待つ
for _ in $(seq 1 36); do
  if curl -s -o /dev/null --max-time 5 https://www.threads.com/; then break; fi
  sleep 5
done

if ! log_run threads-topup npx tsx .claude/skills/sns/publish-threads/publish-threads.ts --from-queue --fill --no-ledger; then
  osascript -e 'display notification "Threads の予約補充に失敗しました。ログ: ~/Library/Logs/stats47/threads-topup.log" with title "stats47"' || true
  exit 1
fi
