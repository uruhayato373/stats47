#!/usr/bin/env node
/**
 * evaluate-survey-experiments.mjs — survey 実験の 7/28/56 日チェックポイント判定 (PR-4)
 *
 * 期日 (evaluateAt7d/28d/56d) に到達した pending 実験へ、portfolio.json の現在実測を
 * observations.dNN として決定的に記録する。verdict の確定は本スクリプトの --verdict 経由でのみ
 * 行う (手編集禁止)。規律 (schema 正典 .claude/state/surveys/README.md):
 *   - d7 は異常検知のみ (インデックス/canonical/404/計測異常。verdict 確定不可。
 *     本番 HTTP/URL Inspection の実測は gsc-analyst へ依頼する — 本スクリプトは数値記録のみ)
 *   - d28 = 暫定 / d56 = 基本判定
 *   - effect/* 確定は observations (d28|d56) + evidenceRefs 必須 (validator E3 が enforce)
 *   - primaryKpi=gsc.ctr は判定観測の gsc.impressions >= 100 が無いと確定不可 (validator E4)
 *   - バックログへの effect ラベル反映は improvement-triage に依頼する (本台帳は判定材料)
 *
 * ★観測値の窓に注意: portfolio.json の metrics は 56d (非重複 2 窓) 集計。d7/d28 の記録も
 *   この 56d 窓のコピーであり「その時点での最新集計」を意味する (7d/28d 純窓ではない)。
 *   judgment 時は baselinePeriod (28d 窓) との窓の違いを notes に注記すること。
 *
 * Usage:
 *   node .claude/scripts/surveys/evaluate-survey-experiments.mjs --check
 *     # 期日到達分に現在実測を記録し、判定待ち一覧を表示
 *   node .claude/scripts/surveys/evaluate-survey-experiments.mjs \
 *     --verdict SURVEY-EXP-001 effect-partial --evidence <ref> [--note "<季節性等の注記>"]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATE_DIR = process.env.STATE_DIR || path.join(PROJECT_ROOT, ".claude/state/surveys");
const PORTFOLIO = path.join(STATE_DIR, "portfolio.json");
const EXPERIMENTS = path.join(STATE_DIR, "experiments.json");

const VERDICTS = new Set(["effect-full", "effect-partial", "effect-none", "effect-adverse", "insufficient-data", "aborted"]);
const CHECKPOINTS = [
  ["d7", "evaluateAt7d"],
  ["d28", "evaluateAt28d"],
  ["d56", "evaluateAt56d"],
];

function load(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** "gsc.impressions" のような KPI パスを portfolio の metrics から解決する (無ければ null) */
function resolveKpi(survey, kpiPath) {
  const [group, field] = String(kpiPath).split(".");
  const m = survey?.metrics?.[group];
  if (!m) return { value: null, status: "missing" };
  if (typeof m[field] === "number") return { value: m[field], status: m.status };
  return { value: null, status: m.status }; // 標本不足等で保存されていない値は null (推測しない)
}

function main() {
  const args = process.argv.slice(2);
  const ex = load(EXPERIMENTS);
  const pf = load(PORTFOLIO);
  const bySurvey = new Map(pf.surveys.map((s) => [s.surveyId, s]));
  const today = new Date().toISOString().slice(0, 10);

  const vIdx = args.indexOf("--verdict");
  if (vIdx >= 0) {
    // ── verdict 確定モード ──
    const id = args[vIdx + 1];
    const verdict = args[vIdx + 2];
    const e = ex.experiments.find((x) => x.experimentId === id);
    if (!e) { console.error(`✗ ${id} が experiments.json に無い`); process.exit(1); }
    if (!VERDICTS.has(verdict)) { console.error(`✗ verdict 不正: ${verdict} (${[...VERDICTS].join("|")})`); process.exit(1); }
    const obs = e.observations ?? {};
    if (!obs.d7 && !obs.d28 && !obs.d56) {
      console.error(`✗ ${id}: observations が空 — 先に --check で期日到達分の実測を記録すること`);
      process.exit(1);
    }
    if (verdict.startsWith("effect-") && !obs.d28 && !obs.d56) {
      console.error(`✗ ${id}: d7 のみで effect/* は確定できない (d7 は異常検知のみ。d28=暫定 / d56=基本判定)`);
      process.exit(1);
    }
    e.verdict = verdict;
    const evIdx = args.indexOf("--evidence");
    if (evIdx >= 0) {
      e.evidenceRefs = e.evidenceRefs ?? [];
      if (!e.evidenceRefs.includes(args[evIdx + 1])) e.evidenceRefs.push(args[evIdx + 1]);
    }
    const nIdx = args.indexOf("--note");
    if (nIdx >= 0) e.notes = args[nIdx + 1];
    fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
    console.log(`verdict: ${id} → ${verdict} (validate-survey-portfolio.ts で E3/E4 を確認すること)`);
    console.log("→ effect/* のバックログ反映は improvement-triage へ引き渡す");
    return;
  }

  // ── --check: 期日到達分に現在実測を記録 ──
  let due = 0, recorded = 0;
  for (const e of ex.experiments) {
    if (e.verdict !== "pending") continue;
    for (const [cp, field] of CHECKPOINTS) {
      const dueDate = e[field];
      if (!dueDate || dueDate > today) continue;
      due++;
      e.observations = e.observations ?? { d7: null, d28: null, d56: null };
      if (e.observations[cp]) continue; // 記録済み
      const survey = bySurvey.get(e.surveyId);
      const values = {};
      for (const kpi of [e.primaryKpi, ...(e.guardrailKpis ?? [])].filter(Boolean)) {
        values[kpi] = resolveKpi(survey, kpi);
      }
      // CTR ガード用に impressions は常に添える (E4 が判定観測から参照する)
      if (!values["gsc.impressions"]) values["gsc.impressions"] = resolveKpi(survey, "gsc.impressions");
      e.observations[cp] = {
        observedAt: today,
        window: survey?.metrics?.gsc?.weeks ?? null, // 56d 非重複 2 窓のコピーであることを明示
        values,
      };
      recorded++;
      const anomalyNote = cp === "d7" ? " (d7 = 異常検知のみ・verdict 確定不可。インデックス/404 実測は gsc-analyst へ)" : "";
      console.log(`記録: ${e.experimentId} ${cp}${anomalyNote}`);
      for (const [k, v] of Object.entries(values)) {
        const base = e.baseline?.[k];
        console.log(`  ${k}: baseline ${base ?? "—"} → ${v.value ?? `null (${v.status})`}`);
      }
    }
  }
  fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
  const pending = ex.experiments.filter((x) => x.verdict === "pending").length;
  console.log(`pending ${pending} 件 / 期日到達 ${due} / 今回記録 ${recorded}`);
  if (recorded > 0) console.log("→ d28/d56 の記録があれば --verdict で判定を確定する (根拠 ref 必須)");
}

main();
