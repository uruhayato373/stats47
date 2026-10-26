#!/usr/bin/env bash
# e-Stat の年カバレッジの週次監査 (2026-10-26 に estat-year-coverage-audit-weekly.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。単年設定の e-Stat 指標を 100 件ずつ巡回し、
# 実在年の台帳から metric の years を同期する。e-Stat の app id (NEXT_PUBLIC_ESTAT_APP_ID) が要る。
# 出力: data/estat/{year-coverage,availability,meta}・data/metrics・ranking-prominence.generated.ts・backlog の年カバレッジのカード
set -uo pipefail
cd "$(dirname "$0")/../../../.."
# CI はリポジトリ変数で渡す。ローカルは git 管理の apps/web/.env.development の値を使う (公開用の app id)
if [ -z "${NEXT_PUBLIC_ESTAT_APP_ID:-}" ]; then
  NEXT_PUBLIC_ESTAT_APP_ID=$(sed -n 's/^NEXT_PUBLIC_ESTAT_APP_ID=//p' apps/web/.env.development | head -1)
  export NEXT_PUBLIC_ESTAT_APP_ID
fi
npx tsx packages/ranking/src/scripts/audit-estat-year-coverage.ts --batch-size "${BATCH_SIZE:-100}" || exit 1
node .claude/scripts/data/sync-year-coverage-backlog.mjs || echo "warning: 年カバレッジのバックログカードの同期に失敗した (監査は続ける)"
npx tsx packages/data-configs/scripts/build-estat-availability.ts || exit 1
npx tsx packages/data-configs/scripts/sync-estat-years.ts || exit 1
(cd apps/web && npx tsx scripts/generate-ranking-prominence.ts) || exit 1
npx tsx packages/data-configs/scripts/build-estat-availability.ts --offline || exit 1
