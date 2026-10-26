#!/usr/bin/env bash
# ランキングデータ整合性の週次監査 (2026-10-26 に ranking-integrity-audit-weekly.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。R2 配信データへの read-only 監査 (HEAD/GET のみ)。
# 整合性・再取り込みキュー (縮小専用ラチェット)・計算型 ranking の再計算・公開データ契約のどれかが違反なら exit 1。
# 出力: data/ranking/integrity-audit.json・data/data-quality/ (データ品質キュー。レビューの Phase 1 が読む)
set -uo pipefail
cd "$(dirname "$0")/../../../.."
export R2_PUBLIC_FETCH_URL="${R2_PUBLIC_FETCH_URL:-https://storage.stats47.jp}"
failed=()
mkdir -p data/ranking
npx tsx packages/ranking/src/scripts/audit-ranking-data-integrity.ts --json data/ranking/integrity-audit.json || failed+=("ranking-integrity")
npx tsx packages/data-configs/scripts/audit-reingest-queue.ts --ratchet || failed+=("reingest-queue")
NODE_OPTIONS=--conditions=react-server npx tsx packages/ranking/scripts/verify-calculated-rankings.ts || failed+=("calculated-rankings")
npm run --silent audit:public-data-contract -- --json "${TMPDIR:-/tmp}/public-data-contract.json" || failed+=("public-data-contract")
npx tsx packages/ranking/src/scripts/build-data-quality-queue.ts || failed+=("data-quality-queue")
if [ "${#failed[@]}" -gt 0 ]; then
  cat <<HINT
違反の出た検査: ${failed[*]}
是正手順:
- values.json 欠落 → generate-ranking-values.ts で再生成。item↔values の年ズレ → どちらが正か確かめて再生成
- home / survey / category の件数の急減 → export-master-snapshots.ts の再生成漏れ・部分集合汚染を疑う
- 再取り込みキュー: stale-delivery は page-data-batch.ts --metric <key>、config-insufficient は diagnose-unpinned-axes.ts --fetch
- 詳細: data/ranking/integrity-audit.json・data/data-quality/LATEST.md・${TMPDIR:-/tmp}/public-data-contract.json
HINT
  exit 1
fi
