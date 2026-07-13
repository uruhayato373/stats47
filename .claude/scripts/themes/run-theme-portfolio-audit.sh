#!/usr/bin/env bash
# run-theme-portfolio-audit.sh — テーマポートフォリオの継続監査コマンド (月次/四半期・PR-4)
#
# build (機械項目再導出) → aggregate (56d 実測) → validate (判定規律) → 実験期日チェック →
# drift サマリ (git HEAD との lifecycle / dataQualityStatus / measured 差分) を一括実行する。
# 破壊的変更はしない (state の再導出のみ。R2 push / deploy / カタログ編集は行わない)。
#
# Usage: bash .claude/scripts/themes/run-theme-portfolio-audit.sh
set -euo pipefail
cd "$(dirname "$0")/../../.."

echo "── 1/5 build (機械項目の再導出) ──"
npx tsx .claude/scripts/themes/build-theme-portfolio.ts

echo "── 2/5 aggregate (56d 実測: GSC/GA4 + R2 データ品質) ──"
npx tsx .claude/scripts/themes/aggregate-theme-metrics.ts

echo "── 3/5 validate (判定規律) ──"
node .claude/scripts/themes/validate-theme-state.mjs

echo "── 4/5 実験期日チェック ──"
node .claude/scripts/themes/evaluate-theme-experiments.mjs --check

echo "── 5/5 drift (git HEAD との差分) ──"
node --input-type=module <<'EOF'
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const cur = JSON.parse(fs.readFileSync(".claude/state/themes/portfolio.json", "utf8"));
let prev;
try {
  prev = JSON.parse(execFileSync("git", ["show", "HEAD:.claude/state/themes/portfolio.json"], { encoding: "utf8" }));
} catch {
  console.log("HEAD に portfolio.json 無し (初回) — drift 比較 skip");
  process.exit(0);
}
const prevBy = new Map(prev.themes.map((t) => [t.themeKey, t]));
const drifts = [];
for (const t of cur.themes) {
  const p = prevBy.get(t.themeKey);
  if (!p) { drifts.push(`${t.themeKey}: 新規`); continue; }
  for (const f of ["lifecycleStatus", "dataQualityStatus", "reviewGate", "latestDataYear"]) {
    if (JSON.stringify(t[f]) !== JSON.stringify(p[f])) drifts.push(`${t.themeKey}: ${f} ${p[f]} → ${t[f]}`);
  }
  for (const m of ["gsc", "ga4"]) {
    if (t.metrics?.[m]?.status !== p.metrics?.[m]?.status)
      drifts.push(`${t.themeKey}: metrics.${m}.status ${p.metrics?.[m]?.status} → ${t.metrics?.[m]?.status}`);
  }
}
for (const t of prev.themes) if (!cur.themes.find((x) => x.themeKey === t.themeKey)) drifts.push(`${t.themeKey}: 消失 (要確認)`);
if (drifts.length === 0) console.log("drift なし");
else drifts.forEach((d) => console.log("Δ", d));
EOF

echo ""
echo "✓ 監査完了。lifecycle 変更・triage 引き渡しは theme-portfolio-manager agent が判断する"
echo "  (skill: /manage-theme-portfolio。判定変更は build-theme-portfolio.ts --set 経由)"
