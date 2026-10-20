#!/bin/bash
# measurement-session-refresh.sh — A8 / もしも / KDP / note の計測ログインと X の予約投稿用ログインを保ち、その直後に CI の収集を起動する
# (launchd 毎週木曜 17:30。2026-10-20 に毎日 + ログイン時から週次へ変えた。セッション中のエージェントはここで記録したデータから判断する)。
# 切れていればキーチェーンの ID/PW で 1 回だけ再ログインし、CI の Secret を更新する。
# 2FA/CAPTCHA/失敗は突破せず停止して Mac に通知する。詳細: .claude/scripts/measurement/refresh-session.mjs
#
# 収集を直後に起動する理由 (2026-09-27): もしものセッションは数時間で切れ、CI の定期実行は予定より 4〜5 時間
# 遅れて動くため、渡したセッションが使われる時点で切れていた。直後の収集なら通る (42 分後の手動収集で成功)。
# 一部の取得元のログインに失敗しても、他の取得元は収集したいので起動は必ず行う。
# 同じ日の定期実行は authenticated-measurement.yml の gate が省略する。
source "$(dirname "$0")/_common.sh"
REFRESH_RC=0
log_run measurement-session-refresh node .claude/scripts/measurement/refresh-session.mjs a8 kdp note --publish || REFRESH_RC=$?
# X は予約投稿 (publish-x) 用。Mac だけで使うので CI へは渡さない (--publish を付けない)
log_run x-session-refresh node .claude/scripts/measurement/refresh-session.mjs x || REFRESH_RC=$?
# Mac で直接取得する経路 (measurement-collect-local.sh) は準備済み。GSC のログインが Mac に揃うまでは CI を起動する。切り替えは MEASUREMENT-MAC-DIRECT-01。
log_run measurement-collect-dispatch gh workflow run authenticated-measurement.yml --ref develop
exit "$REFRESH_RC"
