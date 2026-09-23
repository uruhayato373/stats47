#!/bin/bash
# X の公開済み確認 (ローカル Mac 限定 — X はログインしないとプロフィールが 403 になり CI で読めないため)。
# launchd から毎晩 23:40 とログイン時に発火。スリープ中に時刻が来た回は起きたときに 1 回実行される。
#
# 確認できた status URL は .local/x-posted.jsonl (git 管理外) に残すだけで、git も R2 も触らない
# (並行セッションとの git 競合を避け、R2 state の書き手は CI だけという規約に従う)。
# 台帳への反映はコミットするときに `node .claude/scripts/sns/verify-x-posted.cjs --apply` で行う。
# 予約時刻から 24 時間以上たっても公開を確認できない投稿があれば通知する。
source "$(dirname "$0")/_common.sh"

rc=0
log_run x-verify-posted node .claude/scripts/sns/verify-x-posted.cjs --record || rc=$?

if [ "$rc" -eq 3 ]; then
  osascript -e 'display notification "予約時刻を過ぎても X で確認できない投稿があります。ログ: ~/Library/Logs/stats47/x-verify-posted.log" with title "stats47"' || true
  exit 0
elif [ "$rc" -ne 0 ]; then
  osascript -e 'display notification "X の公開済み確認に失敗しました (ログイン切れの可能性)。ログ: ~/Library/Logs/stats47/x-verify-posted.log" with title "stats47"' || true
  exit 1
fi
