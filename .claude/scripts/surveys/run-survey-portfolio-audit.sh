#!/usr/bin/env bash
# run-survey-portfolio-audit.sh — survey ポートフォリオの継続監査コマンド (月次/四半期・PR-4)
#
# build (機械項目再導出: 紐付け監査 + R2 all.json + survey-editorial.ts) → aggregate (56d 実測) →
# validate (判定規律 + drift) → 実験期日チェック → drift サマリ (git HEAD との差分) を一括実行する。
# 破壊的変更はしない (state の再導出のみ。R2 push / deploy / surveys.json・editorial 編集は行わない)。
#
# Usage: bash .claude/scripts/surveys/run-survey-portfolio-audit.sh
set -euo pipefail
cd "$(dirname "$0")/../../.."

echo "── 1/6 build (機械項目の再導出: 紐付け監査 + R2 + editorial) ──"
npx tsx .claude/scripts/surveys/build-survey-portfolio.ts

echo "── 2/6 compare-r2 (R2 焼き込み突合: live item.json vs git 導出) ──"
npx tsx packages/ranking/src/scripts/audit-survey-linkage.ts --compare-r2 | tail -8

echo "── 3/6 aggregate (56d 実測: GSC/GA4 非重複 2 窓) ──"
npx tsx .claude/scripts/surveys/aggregate-survey-metrics.ts

echo "── 4/6 validate (判定規律 + editorial drift) ──"
npx tsx .claude/scripts/surveys/validate-survey-portfolio.ts

echo "── 5/6 実験期日チェック ──"
node .claude/scripts/surveys/evaluate-survey-experiments.mjs --check

echo "── 6/6 drift (git HEAD との差分) ──"
node --input-type=module <<'EOF'
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const cur = JSON.parse(fs.readFileSync(".claude/state/surveys/portfolio.json", "utf8"));
let prev;
try {
  prev = JSON.parse(execFileSync("git", ["show", "HEAD:.claude/state/surveys/portfolio.json"], { encoding: "utf8" }));
} catch {
  console.log("HEAD に portfolio.json 無し (初回) — drift 比較 skip");
  process.exit(0);
}
const prevBy = new Map(prev.surveys.map((s) => [s.surveyId, s]));
const drifts = [];
for (const s of cur.surveys) {
  const p = prevBy.get(s.surveyId);
  if (!p) { drifts.push(`${s.surveyId}: 新規`); continue; }
  for (const f of ["lifecycleStatus", "editorialStatus", "linkageStatus", "orphanStatus", "editorialContentExists"]) {
    if (JSON.stringify(s[f]) !== JSON.stringify(p[f])) drifts.push(`${s.surveyId}: ${f} ${p[f]} → ${s[f]}`);
  }
  for (const m of ["gsc", "ga4"]) {
    if (s.metrics?.[m]?.status !== p.metrics?.[m]?.status)
      drifts.push(`${s.surveyId}: metrics.${m}.status ${p.metrics?.[m]?.status} → ${s.metrics?.[m]?.status}`);
  }
}
for (const s of prev.surveys) if (!cur.surveys.find((x) => x.surveyId === s.surveyId)) drifts.push(`${s.surveyId}: 消失 (surveys.json からの削除に追従 — orphan 削除なら想定内)`);
if (drifts.length === 0) console.log("drift なし");
else drifts.forEach((d) => console.log("Δ", d));
EOF

echo ""
echo "✓ 監査完了。lifecycle/editorial 変更・triage 引き渡しは survey-curator agent が判断する"
echo "  (skill: /manage-survey-portfolio。判定変更は build-survey-portfolio.ts --set 経由)"
