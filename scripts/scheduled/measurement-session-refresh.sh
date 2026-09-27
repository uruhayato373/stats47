#!/bin/bash
# measurement-session-refresh.sh — A8 / もしも / KDP の計測ログインを保ち、その直後に CI の収集を起動する
# (launchd 毎日 17:30 + ログイン時)。
# 切れていればキーチェーンの ID/PW で 1 回だけ再ログインし、CI の Secret を更新する。
# 2FA/CAPTCHA/失敗は突破せず停止して Mac に通知する。詳細: .claude/scripts/measurement/refresh-session.mjs
#
# 収集を直後に起動する理由 (2026-09-27): もしものセッションは数時間で切れ、CI の定期実行は予定より 4〜5 時間
# 遅れて動くため、渡したセッションが使われる時点で切れていた。直後の収集なら通る (42 分後の手動収集で成功)。
# 一部の取得元のログインに失敗しても、他の取得元は収集したいので起動は必ず行う。
# 同じ日の定期実行は authenticated-measurement.yml の gate が省略する。
source "$(dirname "$0")/_common.sh"
REFRESH_RC=0
log_run measurement-session-refresh node .claude/scripts/measurement/refresh-session.mjs a8 moshimo kdp --publish || REFRESH_RC=$?
log_run measurement-collect-dispatch gh workflow run authenticated-measurement.yml --ref develop
exit "$REFRESH_RC"
