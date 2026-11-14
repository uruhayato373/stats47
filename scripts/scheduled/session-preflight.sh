#!/bin/bash
# session-preflight.sh — ログインが要るサービスの保存済みセッションを毎日確かめ、切れる前に知らせる (launchd・Mac だけ)。
#
# ブラウザを起動せず、ネットワークに出ず、ファイルを読むだけ。専用プロファイルの Cookies と storageState から
# 認証 cookie の名前と期限だけを読み、失敗印 (.local/authenticated-measurement/<source>.autologin-failed) と合わせて分ける。
# 期限が近い (3 日以内)・切れている・失敗印ありがあれば macOS の通知を出す。通知の文に復旧コマンド
# (node .claude/scripts/measurement/refresh-session.mjs <source> --wait-human) が入る。入り直しはオーナーが手で行う。
# 結果は .local/session-preflight/latest.json (管理画面 /ops/auth が読む)。
# 対象と認証 cookie の名前の正本: .claude/config/auth-credentials.json の sessions。実装: .claude/scripts/measurement/session-preflight.mjs
#
# 登録 (オーナーが Mac で 1 回だけ):
#   cp scripts/scheduled/com.stats47.session-preflight.plist ~/Library/LaunchAgents/
#   launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.stats47.session-preflight.plist
source "$(dirname "$0")/_common.sh"
log_run session-preflight node .claude/scripts/measurement/session-preflight.mjs --write --notify
