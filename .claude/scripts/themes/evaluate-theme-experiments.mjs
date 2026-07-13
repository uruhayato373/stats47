#!/usr/bin/env node
/**
 * evaluate-theme-experiments.mjs — テーマ実験の 7/28/56 日チェックポイント判定 (PR-4)
 *
 * 期日 (evaluateAt.d7/d28/d56) に到達した pending 実験へ、portfolio.json の現在実測を
 * result.dNN として決定的に記録する。verdict の確定は本スクリプトの --verdict 経由でのみ行う
 * (手編集禁止)。規律 (schema 正典 .claude/state/themes/README.md):
 *   - d7 は異常検知のみ (verdict 確定不可)
 *   - d28 = 暫定 / d56 = 基本判定
 *   - effect/* 確定は result + evidenceRefs 必須 (validator E3 が enforce)
 *   - バックログへの effect ラベル反映は improvement-triage に依頼する (本台帳は判定材料)
 *
 * Usage:
 *   node .claude/scripts/themes/evaluate-theme-experiments.mjs --check
 *     # 期日到達分に現在実測を記録し、判定待ち一覧を表示
 *   node .claude/scripts/themes/evaluate-theme-experiments.mjs \
 *     --verdict THEME-EXP-001 effect-partial --evidence <ref> [--note "<季節性等の注記>"]
 *   node .claude/scripts/themes/evaluate-theme-experiments.mjs --register '<json>'
 *     # 実験を登録する (手編集禁止の書き込み口)。json は README schema のエントリ 1 件。
 *     # verdict は "pending" 固定で付与。evaluateAt 未設定 (デプロイ待ち) も許容 (--check は発火しない)。
 *   node .claude/scripts/themes/evaluate-theme-experiments.mjs --schedule <id> <YYYY-MM-DD>
 *     # デプロイ日を startedAt に設定し evaluateAt (d7/d28/d56 = +7/+28/+56 日) を機械算出する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATE_DIR = process.env.STATE_DIR || path.join(PROJECT_ROOT, ".claude/state/themes");
const PORTFOLIO = path.join(STATE_DIR, "portfolio.json");
const EXPERIMENTS = path.join(STATE_DIR, "experiments.json");

const VERDICTS = new Set(["effect-full", "effect-partial", "effect-none", "effect-adverse", "insufficient-data", "aborted"]);

function load(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** "gsc.clicks" のような KPI パスを portfolio の metrics から解決する (無ければ null) */
function resolveKpi(theme, kpiPath) {
  const [group, field] = String(kpiPath).split(".");
  const m = theme?.metrics?.[group];
  if (!m) return { value: null, status: "missing" };
  if (typeof m[field] === "number") return { value: m[field], status: m.status };
  return { value: null, status: m.status }; // 標本不足等で保存されていない値は null (推測しない)
}

function main() {
  const args = process.argv.slice(2);
  const ex = load(EXPERIMENTS);
  const pf = load(PORTFOLIO);
  const byTheme = new Map(pf.themes.map((t) => [t.themeKey, t]));
  const today = new Date().toISOString().slice(0, 10);

  const rIdx = args.indexOf("--register");
  if (rIdx >= 0) {
    // ── 実験登録モード ──
    let spec;
    try { spec = JSON.parse(args[rIdx + 1]); } catch (e) {
      console.error(`✗ --register の JSON が不正: ${String(e.message).split("\n")[0]}`);
      process.exit(1);
    }
    for (const req of ["experimentId", "themeKey", "changeType", "hypothesis", "primaryKpi", "baseline"]) {
      if (!spec[req]) { console.error(`✗ 必須フィールド欠落: ${req}`); process.exit(1); }
    }
    if (!byTheme.has(spec.themeKey)) { console.error(`✗ themeKey 不明: ${spec.themeKey}`); process.exit(1); }
    if (ex.experiments.some((x) => x.experimentId === spec.experimentId)) {
      console.error(`✗ experimentId 重複: ${spec.experimentId}`); process.exit(1);
    }
    const entry = {
      guardrailKpis: [], baselinePeriod: null, startedAt: null, evaluateAt: null,
      result: null, notes: null, evidenceRefs: [],
      ...spec,
      verdict: "pending",
    };
    ex.experiments.push(entry);
    fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
    console.log(`登録: ${entry.experimentId} (${entry.themeKey} / ${entry.changeType})` +
      (entry.evaluateAt ? "" : " — evaluateAt 未設定 (デプロイ後に設定するまで --check は発火しない)"));
    console.log("→ validate-theme-state.mjs で E 規律 (重複/baseline) を確認すること");
    return;
  }

  const sIdx = args.indexOf("--schedule");
  if (sIdx >= 0) {
    // ── 期日設定モード (デプロイ日 → startedAt + evaluateAt を機械算出) ──
    const id = args[sIdx + 1];
    const start = args[sIdx + 2];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? "")) { console.error("✗ 日付は YYYY-MM-DD"); process.exit(1); }
    const e = ex.experiments.find((x) => x.experimentId === id);
    if (!e) { console.error(`✗ ${id} が experiments.json に無い`); process.exit(1); }
    const plus = (days) => {
      const d = new Date(start + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + days);
      return d.toISOString().slice(0, 10);
    };
    e.startedAt = start;
    e.evaluateAt = { d7: plus(7), d28: plus(28), d56: plus(56) };
    fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
    console.log(`schedule: ${id} startedAt=${start} d7=${e.evaluateAt.d7} d28=${e.evaluateAt.d28} d56=${e.evaluateAt.d56}`);
    return;
  }

  const vIdx = args.indexOf("--verdict");
  if (vIdx >= 0) {
    // ── verdict 確定モード ──
    const id = args[vIdx + 1];
    const verdict = args[vIdx + 2];
    const e = ex.experiments.find((x) => x.experimentId === id);
    if (!e) { console.error(`✗ ${id} が experiments.json に無い`); process.exit(1); }
    if (!VERDICTS.has(verdict)) { console.error(`✗ verdict 不正: ${verdict} (${[...VERDICTS].join("|")})`); process.exit(1); }
    if (!e.result?.d7 && !e.result?.d28 && !e.result?.d56) {
      console.error(`✗ ${id}: result が空 — 先に --check で期日到達分の実測を記録すること`);
      process.exit(1);
    }
    if (verdict.startsWith("effect-") && !e.result?.d28 && !e.result?.d56) {
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
    console.log(`verdict: ${id} → ${verdict} (validator で E3 を確認すること)`);
    return;
  }

  // ── --check: 期日到達分に現在実測を記録 ──
  let due = 0, recorded = 0;
  for (const e of ex.experiments) {
    if (e.verdict !== "pending") continue;
    for (const cp of ["d7", "d28", "d56"]) {
      const dueDate = e.evaluateAt?.[cp];
      if (!dueDate || dueDate > today) continue;
      due++;
      if (e.result?.[cp]) continue; // 記録済み
      const theme = byTheme.get(e.themeKey);
      const values = {};
      for (const kpi of [e.primaryKpi, ...(e.guardrailKpis ?? [])].filter(Boolean)) {
        values[kpi] = resolveKpi(theme, kpi);
      }
      e.result = e.result ?? {};
      e.result[cp] = { observedAt: today, values };
      recorded++;
      const anomalyNote = cp === "d7" ? " (d7 = 異常検知のみ・verdict 確定不可)" : "";
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
