#!/usr/bin/env bash
# 図の表示単位の台帳の週次作り直し (2026-11-03)。
# 呼び出し元: run-weekly-audits.mjs (npm run weekly:audits)。公開中の都道府県ランキングの最新年の値を R2 から読み、
# 図に書く単位・倍率・小数桁を data/metrics/display-units/ledger.json に作り直してから、規則との一致を確かめる。
# 新しく公開した指標の行も、単位を直して取り込み直した指標の行もここで埋まる。
# 規約: .claude/rules/unit-semantics-standards.md §2.6
set -uo pipefail
cd "$(dirname "$0")/../../../.."
npx tsx packages/data-configs/scripts/build-chart-display-units.ts || exit 1
npx tsx packages/data-configs/scripts/build-chart-display-units.ts --check || exit 1
