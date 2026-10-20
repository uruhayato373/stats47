#!/bin/bash
# measurement-session-refresh.sh — A8 / KDP / note / 楽天の計測ログインと X の予約投稿用ログインを保ち、その直後に Mac で計測を取得する
# (launchd 毎週木曜 17:30。2026-10-20 に毎日 + ログイン時から週次へ変えた。セッション中のエージェントはここで記録したデータから判断する)。
# 切れていればキーチェーンの ID/PW で 1 回だけ再ログインする。ログインは週 1 回この Mac だけが持ち、CI へは渡さない
# (2026-10-20 オーナー判断。CI の認証付き計測は撤去した)。
# 2FA/CAPTCHA/失敗は突破せず停止して Mac に通知する。詳細: .claude/scripts/measurement/refresh-session.mjs
#
# 取得はログインの直後に Mac で行う (MEASUREMENT-MAC-DIRECT-01)。
# 一部の取得元のログインに失敗しても、他の取得元は取得したいので取得は必ず行う。失敗した取得元は次の木曜まで判定不能になる。
source "$(dirname "$0")/_common.sh"
REFRESH_RC=0
log_run measurement-session-refresh node .claude/scripts/measurement/refresh-session.mjs a8 kdp note rakuten || REFRESH_RC=$?
# X は予約投稿 (publish-x) 用
log_run x-session-refresh node .claude/scripts/measurement/refresh-session.mjs x || REFRESH_RC=$?
log_run measurement-collect-local bash "$PROJECT_DIR/scripts/scheduled/measurement-collect-local.sh" || REFRESH_RC=$?
exit "$REFRESH_RC"
