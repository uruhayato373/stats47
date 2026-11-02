#!/usr/bin/env bash
# 指標の定義 (data/metrics/*.ts)・テーマのカタログ・調査マスタを変えたあとに、それらから作る生成物を依存順にまとめて作り直す。
#
# なぜ要るか (2026-11-02): 家計調査の貯蓄・負債の 4 指標を足したとき、指標の schema・コンテンツ索引・逆引き索引・
# 調査の分類・テーマの依存の写し・掲載価値の生成物が 1 つずつ古くなり、pre-commit と PR の CI で 7 回に分けて落ちた。
# どれも決定的に作り直せるので、1 回で全部作り直してから commit する。
#
#   npm run metrics:regen-derived
#
# 対象外 (この script では作らない):
#   - 既知キー・sitemap のキー: R2 の item.json が要る。sync-snapshots の sync-ranking-keys job が作る
#   - 指標の極性 (data/metrics/policy/polarity.ts): 判断なので手で足す (validate:polarity が止める)
set -euo pipefail
cd "$(dirname "$0")/../../.."

run() { echo "▶ $*"; "$@"; }

run npm --workspace packages/data-configs run metrics:generate-schema
run npm run content:sync
run npm run metrics:build-index
run npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --offline --json data/surveys/taxonomy.json
run npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts
(cd apps/web && run npx tsx scripts/generate-ranking-prominence.ts)

echo "▶ 変わった生成物"
git status --short -- data packages apps/web/src | grep -v '^??' || echo "(なし)"
echo "次: npm run preflight:pr で CI と同じ検査を通してから commit する"
