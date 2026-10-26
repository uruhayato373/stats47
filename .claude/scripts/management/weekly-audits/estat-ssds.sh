#!/usr/bin/env bash
# 社会・人口統計体系 (SSDS) の都道府県テーブルの全 cat01 を列挙し、ランキング候補の台帳を作り直す
# (2026-10-26 に estat-ssds-enum.yml の定期実行から週次レビューへ移した。手動起動は workflow に残る)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。出力: data/estat/ssds-candidates*.json
set -uo pipefail
cd "$(dirname "$0")/../../../.."
if [ -z "${NEXT_PUBLIC_ESTAT_APP_ID:-}" ]; then
  NEXT_PUBLIC_ESTAT_APP_ID=$(sed -n 's/^NEXT_PUBLIC_ESTAT_APP_ID=//p' apps/web/.env.development | head -1)
  export NEXT_PUBLIC_ESTAT_APP_ID
fi
node .claude/scripts/estat/enumerate-ssds-indicators.mjs
