#!/bin/bash
# measurement-session-refresh.sh — A8 / KDP / note / 楽天の計測ログインと X の予約投稿用ログインを保ち、その直後に Mac で計測を取得する
# (launchd 毎週木曜 17:30。2026-10-20 に毎日 + ログイン時から週次へ変えた。セッション中のエージェントはここで記録したデータから判断する)。
# 切れていればキーチェーンの ID/PW で 1 回だけ再ログインし、CI の Secret を更新する (CI の予備が使う)。
# 2FA/CAPTCHA/失敗は突破せず停止して Mac に通知する。詳細: .claude/scripts/measurement/refresh-session.mjs
#
# 取得はログインの直後に Mac で行う (2026-10-20 に CI の起動から切り替え。MEASUREMENT-MAC-DIRECT-01)。
# 一部の取得元のログインに失敗しても、他の取得元は取得したいので取得は必ず行う。
# CI の authenticated-measurement.yml (木曜 20:20 JST) は予備で、ここで pass しなかった取得元だけを取り直す。
source "$(dirname "$0")/_common.sh"
REFRESH_RC=0
log_run measurement-session-refresh node .claude/scripts/measurement/refresh-session.mjs a8 kdp note rakuten --publish || REFRESH_RC=$?
# X は予約投稿 (publish-x) 用。Mac だけで使うので CI へは渡さない (--publish を付けない)
log_run x-session-refresh node .claude/scripts/measurement/refresh-session.mjs x || REFRESH_RC=$?
log_run measurement-collect-local bash "$PROJECT_DIR/scripts/scheduled/measurement-collect-local.sh" || REFRESH_RC=$?
exit "$REFRESH_RC"
