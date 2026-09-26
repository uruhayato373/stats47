#!/bin/bash
# measurement-session-refresh.sh — A8 / もしもの計測ログインを CI (JST 18:20) の前に保つ (launchd 毎日 17:30 + ログイン時)。
# 切れていればキーチェーンの ID/PW で 1 回だけ再ログインし、CI の Secret を更新する。
# 2FA/CAPTCHA/失敗は突破せず停止して Mac に通知する。詳細: .claude/scripts/measurement/refresh-session.mjs
source "$(dirname "$0")/_common.sh"
log_run measurement-session-refresh node .claude/scripts/measurement/refresh-session.mjs a8 moshimo --publish
