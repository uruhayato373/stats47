#!/usr/bin/env bash
# 調査 taxonomy の横断整合・鮮度と survey portfolio の週次監査 (2026-10-26 に survey-taxonomy-audit-weekly.yml から週次レビューへ移した)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。taxonomy の再構築 (ratchet を縮める) と offline 検査、portfolio の再評価のどれかが落ちると exit 1。
# 出力: data/surveys/{taxonomy,portfolio,experiments}.json・.claude/config/survey-taxonomy-ratchet.json
set -uo pipefail
cd "$(dirname "$0")/../../../.."
failed=()
npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --json data/surveys/taxonomy.json --tighten-ratchet || failed+=("taxonomy-build")
npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --offline --check || failed+=("taxonomy-check")
bash .claude/scripts/surveys/run-survey-portfolio-audit.sh || failed+=("portfolio")
if [ "${#failed[@]}" -gt 0 ]; then echo "落ちた検査: ${failed[*]}"; exit 1; fi
