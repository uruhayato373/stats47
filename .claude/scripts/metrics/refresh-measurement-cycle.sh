#!/usr/bin/env bash
# 計測→記録→改善サイクルの週次 state を作り直す。
# 呼び出し元: fetch-metrics-weekly.yml (日曜。GA4/GSC snapshot の直後) と improvement-cycle-weekly.yml (月曜 06:00 JST)。
# 月曜にも作り直すのは、日曜の sns-metrics-weekly が fetch-metrics-weekly より後に終わるため
# (2026-09-20 実測: metrics 14:33Z 完了 → SNS 取得 14:47Z)。日曜の state だけだとその週の SNS が入らない。
# GA4 Admin 監査 state は google-admin README の規約で commit しないので /tmp へ退避し、派生値だけ builder に渡す。
#
# 使い方: bash .claude/scripts/metrics/refresh-measurement-cycle.sh YYYY-Www
set -uo pipefail
WEEK="${1:?YYYY-Www が必要}"
ARGS=(--week "$WEEK")
if ! node .claude/scripts/google-admin/cli.mjs audit-api > /tmp/google-admin-audit.txt 2>&1; then
  echo "::warning::google-admin audit-api が非0終了 (AdSense 認証など identity 未達でも起きる。custom dimension は builder が status を見る)"
fi
if [ -f .claude/state/metrics/google-admin/api-latest.json ]; then
  cp .claude/state/metrics/google-admin/api-latest.json /tmp/google-admin-api-latest.json
  ARGS+=(--admin-audit /tmp/google-admin-api-latest.json)
fi
rm -rf .claude/state/metrics/google-admin
node .claude/scripts/metrics/build-measurement-cycle.mjs "${ARGS[@]}"
