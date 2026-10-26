#!/usr/bin/env bash
# 計測→記録→改善サイクルの週次 state を作り直す。
# 呼び出し元: fetch-metrics-weekly.yml (土曜 02:00 JST。GA4/GSC snapshot の直後) と、土曜の /weekly-review Phase 0b (Mac)。
# レビューでも作り直すのは、Mac が土曜 07:00 に取る認証付き計測 (A8・note・KDP・楽天) が 02:00 の state に入らないため
# (2026-10-26 に CI の improvement-cycle-weekly.yml から移した)。
# GA4 Admin 監査 state は google-admin README の規約で commit しないので /tmp へ退避し、派生値だけ builder に渡す。
#
# 使い方: bash .claude/scripts/metrics/refresh-measurement-cycle.sh YYYY-Www
set -uo pipefail
WEEK="${1:?YYYY-Www が必要}"
ARGS=(--week "$WEEK")
# GA4 Admin の監査は GA4_PROPERTY_ID を必須にする (CI では既定値に頼らず設定漏れで止める)。Mac のレビューでは
# .env.local に置いていないので、CI の外に限って site-config.cjs の値を使う。
if [ -z "${GA4_PROPERTY_ID:-}" ] && [ -z "${CI:-}" ]; then
  GA4_PROPERTY_ID=$(node -e 'process.stdout.write(String(require("./.claude/scripts/lib/site-config.cjs").GA4_PROPERTY_ID))')
  export GA4_PROPERTY_ID
fi
if ! node .claude/scripts/google-admin/cli.mjs audit-api > /tmp/google-admin-audit.txt 2>&1; then
  echo "::warning::google-admin audit-api が非0終了 (AdSense 認証など identity 未達でも起きる。custom dimension は builder が status を見る)"
fi
if [ -f .claude/state/metrics/google-admin/api-latest.json ]; then
  cp .claude/state/metrics/google-admin/api-latest.json /tmp/google-admin-api-latest.json
  ARGS+=(--admin-audit /tmp/google-admin-api-latest.json)
fi
rm -rf .claude/state/metrics/google-admin
node .claude/scripts/metrics/build-measurement-cycle.mjs "${ARGS[@]}"
