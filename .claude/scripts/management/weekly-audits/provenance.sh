#!/usr/bin/env bash
# 出典・再現性の週次全量監査 (2026-10-26 に provenance-audit-weekly.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。validator が 1 つでも error なら exit 1。
# 出力: data/provenance/{queue.json,LATEST.md}。是正は /audit-provenance (正典 .claude/rules/data-provenance-standards.md)
set -uo pipefail
cd "$(dirname "$0")/../../../.."
npx tsx .claude/scripts/provenance/audit-provenance-queue.ts || exit 1
failed=()
for check in validate:config validate:catalog validate:area-databook validate:prefecture-statistics \
  validate:open-data-catalog check:prefecture-statistics-links check:open-data-links; do
  echo "=== $check ==="
  npm run --silent "$check" --workspace=@stats47/data-configs || failed+=("$check")
done
echo "=== Japan Zue evidence inventory ==="
node .claude/scripts/lib/check-japan-zue-evidence-inventory.mjs || failed+=("japan-zue-evidence-inventory")
echo "D クラス: $(node -e "const d=require('./data/provenance/queue.json'); console.log((d.byClass&&d.byClass.D)||0)") 件 (data/provenance/LATEST.md)"
if [ "${#failed[@]}" -gt 0 ]; then
  echo "error の出た検査: ${failed[*]}"
  exit 1
fi
