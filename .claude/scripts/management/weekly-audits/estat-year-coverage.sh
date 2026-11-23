#!/usr/bin/env bash
# e-Stat の年カバレッジの週次監査 (2026-10-26 に estat-year-coverage-audit-weekly.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。e-Stat の実在年の台帳を取り直し、metric の years を同期する。
# e-Stat の app id (NEXT_PUBLIC_ESTAT_APP_ID) が要る。
# 出力: data/estat/{availability,meta}・data/metrics・ranking-prominence.generated.ts
# 2026-11-23: 北海道 1 県をサンプルにした旧監査 (audit-estat-year-coverage.ts と YEAR-COV の自動起票) を廃止した。
# 取り込みと同じ条件で値のある県を数える台帳では、旧監査の要拡張候補 29 件はどれも足す年が 0 件だった
# (旧監査は北海道だけに値のある年や、取り込みと違う取得条件の年も数えていた。例: コンビニ販売額の 2021・2025 年。ESTAT-YEAR-AVAILABILITY-01)
set -uo pipefail
cd "$(dirname "$0")/../../../.."
# CI はリポジトリ変数で渡す。ローカルは git 管理の apps/web/.env.development の値を使う (公開用の app id)
export NEXT_PUBLIC_ESTAT_APP_ID="$(node --input-type=module -e 'import { getAppId } from "./packages/ops/src/estat/catalog-api.mjs"; process.stdout.write(getAppId(process.env, "apps/web/.env.development"))')"
npx tsx packages/data-configs/scripts/build-estat-availability.ts || exit 1
npx tsx packages/data-configs/scripts/sync-estat-years.ts || exit 1
(cd apps/web && npx tsx scripts/generate-ranking-prominence.ts) || exit 1
npx tsx packages/data-configs/scripts/build-estat-availability.ts --offline || exit 1
