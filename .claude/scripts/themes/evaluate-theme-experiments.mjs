#!/usr/bin/env node
/**
 * evaluate-theme-experiments.mjs — テーマ実験の 7/28/56 日チェックポイント判定 (PR-4)
 *
 * 期日 (evaluateAt.d7/d28/d56) は確認を始める日であり、観測窓の代用ではない。
 * 公開後の完全な期間・対象範囲・標本状態を確認して result.dNN に記録する。
 * 旧 result.dNN を保存したまま、窓不足等の再観測は result.rechecks.dNN に追記する。
 * baselineScopes / baselineStatuses が不明な旧 baseline は effect 確定に使わない。
 * verdict の確定は本スクリプトの --verdict 経由でのみ行う
 * (手編集禁止)。規律 (schema 正典 .claude/state/themes/README.md):
 *   - d7 は異常検知のみ (verdict 確定不可)
 *   - d28 = 28 日窓で暫定 (effect 確定不可) / d56 = 公開後 56 日で基本判定
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
 *   node .claude/scripts/themes/evaluate-theme-experiments.mjs --update-baseline <id> '<json>'
 *   node .claude/scripts/themes/evaluate-theme-experiments.mjs --schedule <id> <YYYY-MM-DD>
 *     # デプロイ日を startedAt に設定し evaluateAt (d7/d28/d56 = +7/+28/+56 日) を機械算出する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { addDays, jstDateOf } from "../metrics/lib/periods.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATE_DIR = process.env.STATE_DIR || path.join(PROJECT_ROOT, ".claude/state/themes");
const PORTFOLIO = path.join(STATE_DIR, "portfolio.json");
const EXPERIMENTS = path.join(STATE_DIR, "experiments.json");

export const CHANGE_TYPES = new Set(["catalog-metrics", "catalog-charts", "copy", "structure", "merge", "split", "rename", "retire", "launch"]);
export const VERDICTS = new Set(["pending", "launch-reviewed", "effect-full", "effect-partial", "effect-none", "effect-adverse", "insufficient-data", "aborted"]);

function load(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** "gsc.clicks" のような KPI パスを portfolio の metrics から解決する (無ければ null) */
function resolveKpi(theme, kpiPath, checkpoint) {
  const [group, field] = String(kpiPath).split(".");
  const m = (checkpoint === "d28" ? theme?.metrics28d ?? theme?.metrics : theme?.metrics)?.[group];
  return {
    value: Number.isFinite(m?.[field]) ? m[field] : null,
    status: m?.status ?? "missing",
    scope: m?.scope ?? null,
    windowDays: m?.windowDays ?? null,
    periodStart: m?.periodStart ?? null,
    periodEnd: m?.periodEnd ?? null,
    weeks: m?.weeks ?? [],
  };
}

function validDate(value) {
  try { return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") && addDays(value, 0) === value; }
  catch { return false; }
}

function expectedScope(kpi) {
  return String(kpi).startsWith("gsc.") ? "search-console" : "Japan";
}

/** Portfolio の日付付き集計契約を確認する。期日や週番号を観測期間の代用にしない。 */
function measurementLimits(value, kpi, experiment, days, observedAt, allowLowCounts = false) {
  const reasons = [];
  const lowCount = allowLowCounts && value?.status === "measured-low"
    && ["gsc.clicks", "gsc.impressions", "ga4.pageViews"].includes(kpi);
  if ((value?.status !== "measured" && !lowCount) || !Number.isFinite(value?.value)) reasons.push("missing-or-low-sample");
  if (value?.scope !== expectedScope(kpi)) reasons.push("scope-unknown-or-incompatible");
  if (value?.windowDays !== days || !validDate(value?.periodStart) || !validDate(value?.periodEnd)
      || addDays(value.periodStart, days - 1) !== value.periodEnd) reasons.push("complete-window-unavailable");
  if (!validDate(experiment.startedAt) || !validDate(value?.periodStart) || value.periodStart < experiment.startedAt) reasons.push("window-includes-pre-publication");
  if (!validDate(observedAt) || !validDate(value?.periodEnd) || value.periodEnd > observedAt) reasons.push("window-not-observed-yet");
  // 56 日値は aggregator が非重複の 28 日レポート 2 本から生成する。参照の欠落・二重計上も拒否。
  if (days === 56 && (!Array.isArray(value?.weeks) || value.weeks.length !== 2 || new Set(value.weeks).size !== 2
      || !value.weeks.every((week) => /^\d{4}-W\d{2}$/.test(week)))) reasons.push("non-overlapping-report-references-unavailable");
  // activeUsersLast28d は 56 日集計の中でも最新 28 日だけの値。56 日値とは比較しない。
  if (days === 56 && String(kpi).endsWith("Last28d")) reasons.push("kpi-is-28-days-only");
  return reasons;
}

function baselineLimits(experiment, kpi, days) {
  const group = String(kpi).split(".")[0];
  const reasons = [];
  if (!Number.isFinite(experiment.baseline?.[kpi]) || experiment.baselineStatuses?.[kpi] !== "measured") reasons.push("baseline-missing-or-low-sample");
  if (experiment.baselineScopes?.[group] !== expectedScope(kpi)) reasons.push("baseline-scope-unknown-or-incompatible");
  if (days === 56) {
    const period = experiment.baselinePeriod;
    if (!validDate(period?.from) || !validDate(period?.to) || addDays(period.from, 55) !== period.to)
      reasons.push("baseline-complete-window-unavailable");
    if (!validDate(period?.to) || !validDate(experiment.startedAt) || period.to >= experiment.startedAt)
      reasons.push("baseline-overlaps-publication");
  }
  return reasons;
}

/** 保存済みの実測から再検査する。旧 result の日付・国条件を現在の portfolio から補完しない。 */
export function assessCheckpoint(experiment, checkpoint, observation) {
  if (checkpoint === "d7") return { status: "quality-only", reasons: ["d7-is-quality-observation"], constraints: [] };
  const days = checkpoint === "d28" ? 28 : 56;
  const primary = experiment.primaryKpi;
  const launch = experiment.changeType === "launch";
  const reasons = [
    ...measurementLimits(observation?.values?.[primary], primary, experiment, days, observation?.observedAt, launch),
    ...(launch ? [] : baselineLimits(experiment, primary, days)),
  ];
  const constraints = (experiment.guardrailKpis ?? []).flatMap((kpi) => [
    ...measurementLimits(observation?.values?.[kpi], kpi, experiment, days, observation?.observedAt, launch),
    ...(launch ? [] : baselineLimits(experiment, kpi, days)),
  ].map((reason) => `${kpi}: ${reason}`));
  const status = reasons.length ? "insufficient-data" : launch
    ? checkpoint === "d28" ? "launch-provisional" : "launch-observed"
    : checkpoint === "d28" ? "provisional" : "eligible";
  if (launch) constraints.push("new-url-has-no-pre-publication-baseline");
  if (launch && observation?.values?.[primary]?.status === "measured-low") constraints.push("primary-low-sample-count-only");
  return { status, reasons, constraints };
}

export function observeCheckpoint(experiment, checkpoint, theme, observedAt) {
  if (checkpoint === "d7") return {
    observedAt, status: "quality-only", values: {},
    quality: { status: theme?.dataQualityStatus ?? "unknown", ...(theme?.dataQuality ?? {}) },
  };
  const observation = { observedAt, values: {} };
  for (const kpi of [experiment.primaryKpi, ...(experiment.guardrailKpis ?? [])].filter(Boolean)) {
    observation.values[kpi] = resolveKpi(theme, kpi, checkpoint);
  }
  return { ...observation, ...assessCheckpoint(experiment, checkpoint, observation) };
}

export function latestObservation(experiment, checkpoint) {
  return experiment.result?.rechecks?.[checkpoint]?.at(-1) ?? experiment.result?.[checkpoint];
}

/** 旧 result.dNN は書き換えず、新しい適合窓が届いた場合だけ再観測を追記する。 */
export function recordCheckpoint(experiment, checkpoint, observation) {
  experiment.result ??= {};
  if (!experiment.result[checkpoint]) { experiment.result[checkpoint] = observation; return true; }
  const prior = latestObservation(experiment, checkpoint);
  const assessment = assessCheckpoint(experiment, checkpoint, prior);
  if (assessment.status !== "insufficient-data" && (checkpoint !== "d7" || prior.quality)) return false;
  const withoutDate = ({ observedAt: _observedAt, ...rest }) => rest;
  if (JSON.stringify(withoutDate(prior)) === JSON.stringify(withoutDate(observation))) return false;
  experiment.result.rechecks ??= {};
  (experiment.result.rechecks[checkpoint] ??= []).push(observation);
  return true;
}

/** Registration and state lint share one contract; launch never uses an invented zero baseline. */
export function experimentIssues(e, { registration = false } = {}) {
  if (!e || typeof e !== "object" || Array.isArray(e)) return ["実験はobject必須"];
  const issues = [];
  for (const key of ["experimentId", "themeKey", "hypothesis", "primaryKpi"])
    if (typeof e[key] !== "string" || !e[key].trim()) issues.push(`${key} 欠落`);
  if (!CHANGE_TYPES.has(e.changeType)) issues.push(`changeType 不正 (${e.changeType})`);
  if (!VERDICTS.has(e.verdict)) issues.push(`verdict 不正 (${e.verdict})`);
  if (!Array.isArray(e.guardrailKpis ?? []) || !(e.guardrailKpis ?? []).every((k) => typeof k === "string" && /^(gsc|ga4|internalNav)\.[A-Za-z][A-Za-z0-9]*$/.test(k))) issues.push("guardrailKpis 不正");
  if (typeof e.primaryKpi === "string" && !/^(gsc|ga4|internalNav)\.[A-Za-z][A-Za-z0-9]*$/.test(e.primaryKpi)) issues.push("primaryKpi 不正");
  if (!Array.isArray(e.evidenceRefs ?? []) || !(e.evidenceRefs ?? []).every((r) => typeof r === "string" && r.trim())) issues.push("evidenceRefs 不正");
  if (e.changeType === "launch") {
    if (e.baseline !== null || e.baselinePeriod != null || e.baselineStatus !== "not-applicable-new-url"
        || Object.keys(e.baselineScopes ?? {}).length || Object.keys(e.baselineStatuses ?? {}).length)
      issues.push("launch は baseline=null / baselineStatus=not-applicable-new-url が必須（公開前を0にしない）");
    if (e.verdict?.startsWith("effect-")) issues.push("launch は effect/* を確定できない");
  } else {
    if (!e.baseline || typeof e.baseline !== "object" || Array.isArray(e.baseline) || !Object.keys(e.baseline).length)
      issues.push("baseline 欠落 — 改善実験はbaseline必須");
    if (e.verdict === "launch-reviewed") issues.push("launch-reviewed は launch 専用");
  }
  if (e.evaluateAt != null) {
    if (!validDate(e.startedAt) || [7, 28, 56].some((n) => e.evaluateAt[`d${n}`] !== addDays(e.startedAt, n))) issues.push("evaluateAt は startedAt +7/+28/+56日が必須");
  } else if (e.startedAt != null && !validDate(e.startedAt)) issues.push("startedAt 不正");
  if (registration && (e.startedAt != null || e.evaluateAt != null || e.result != null || e.verdict !== "pending"))
    issues.push("登録時は pending / startedAt,evaluateAt,result=null。公開後に --schedule する");
  return issues;
}

/** A first valid launch window can seed a later improvement, never the launch's own baseline. */
export function launchBaselineCandidate(experiment, observation) {
  if (experiment.changeType !== "launch" || assessCheckpoint(experiment, "d56", observation).status !== "launch-observed") return null;
  const primary = observation.values[experiment.primaryKpi];
  if (primary.status !== "measured") return null;
  const candidate = {
    sourceExperimentId: experiment.experimentId, sourceObservedAt: observation.observedAt,
    baselinePeriod: { from: primary.periodStart, to: primary.periodEnd }, baseline: {}, baselineScopes: {}, baselineStatuses: {},
    evidenceRefs: [`.claude/state/themes/experiments.json#${experiment.experimentId}/d56/${observation.observedAt}`],
  };
  for (const [kpi, value] of Object.entries(observation.values)) {
    if (measurementLimits(value, kpi, experiment, 56, observation.observedAt, true).length
        || value.periodStart !== primary.periodStart || value.periodEnd !== primary.periodEnd) continue;
    candidate.baseline[kpi] = value.value;
    candidate.baselineStatuses[kpi] = value.status;
    candidate.baselineScopes[kpi.split(".")[0]] = value.scope;
  }
  return candidate;
}

function reject(message) { console.error(`✗ ${message}`); process.exit(1); }

function main() {
  const args = process.argv.slice(2);
  const modes = ["--register", "--update-baseline", "--schedule", "--check", "--verdict", "--launch-review"];
  const known = new Set([...modes, "--evidence", "--note"]);
  if (args.filter((a) => modes.includes(a)).length > 1 || args.some((a) => a.startsWith("--") && !known.has(a)))
    reject("操作は1件ずつ、既知のオプションだけ指定する");
  const ex = load(EXPERIMENTS);
  const pf = load(PORTFOLIO);
  const byTheme = new Map(pf.themes.map((t) => [t.themeKey, t]));
  const today = jstDateOf();

  const rIdx = args.indexOf("--register");
  if (rIdx >= 0) {
    // ── 実験登録モード ──
    let spec;
    try { spec = JSON.parse(args[rIdx + 1]); } catch (e) {
      console.error(`✗ --register の JSON が不正: ${String(e.message).split("\n")[0]}`);
      process.exit(1);
    }
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) reject("登録JSONはobject必須");
    const entry = {
      guardrailKpis: [], baselinePeriod: null, startedAt: null, evaluateAt: null,
      result: null, notes: null, evidenceRefs: [], verdict: "pending", ...spec,
    };
    const issues = experimentIssues(entry, { registration: true });
    if (issues.length) reject(issues.join("; "));
    if (!byTheme.has(entry.themeKey)) reject(`themeKey 不明: ${entry.themeKey}`);
    if (ex.experiments.some((x) => x.experimentId === entry.experimentId)) reject(`experimentId 重複: ${entry.experimentId}`);
    if (ex.experiments.some((x) => x.themeKey === entry.themeKey && x.changeType === entry.changeType && x.verdict === "pending")) reject("同一themeKey × changeTypeのpending実験は1件まで");
    ex.experiments.push(entry);
    fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
    console.log(`登録: ${entry.experimentId} (${entry.themeKey} / ${entry.changeType})` +
      (entry.evaluateAt ? "" : " — evaluateAt 未設定 (デプロイ後に設定するまで --check は発火しない)"));
    console.log("→ validate-theme-state.mjs で E 規律 (重複/baseline) を確認すること");
    return;
  }

  const baselineIdx = args.indexOf("--update-baseline");
  if (baselineIdx >= 0) {
    const id = args[baselineIdx + 1];
    const entry = ex.experiments.find((e) => e.experimentId === id);
    if (!entry) reject(`${id} が experiments.json に無い`);
    if (entry.changeType === "launch") reject("launch にbaselineは設定できない");
    if (entry.verdict !== "pending" || entry.startedAt != null || entry.evaluateAt != null || entry.result != null)
      reject("baseline修正は未開始pendingだけ。公開日・観測・判定済みの履歴は変更不可");
    let patch;
    try { patch = JSON.parse(args[baselineIdx + 2]); }
    catch { reject("--update-baseline のJSONが不正"); }
    const allowed = new Set(["baseline", "baselinePeriod", "baselineScopes", "baselineStatuses", "evidenceRefs"]);
    if (!patch || typeof patch !== "object" || Array.isArray(patch) || !Object.keys(patch).length
        || Object.keys(patch).some((key) => !allowed.has(key)))
      reject("変更可能なのはbaseline・期間・scope・status・evidenceRefsだけ");
    const next = { ...entry, ...patch };
    const issues = experimentIssues(next, { registration: true });
    if (issues.length) reject(issues.join("; "));
    if (!next.evidenceRefs?.length) reject("baseline修正には実測evidenceRefsが必要");
    Object.assign(entry, patch);
    fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
    console.log(`baseline更新: ${id} (未開始・公開日未設定のまま)`);
    return;
  }

  const sIdx = args.indexOf("--schedule");
  if (sIdx >= 0) {
    // ── 期日設定モード (デプロイ日 → startedAt + evaluateAt を機械算出) ──
    const id = args[sIdx + 1];
    const start = args[sIdx + 2];
    if (!validDate(start)) { console.error("✗ 日付は実在する YYYY-MM-DD"); process.exit(1); }
    const e = ex.experiments.find((x) => x.experimentId === id);
    if (!e) { console.error(`✗ ${id} が experiments.json に無い`); process.exit(1); }
    if (start > today) reject("公開前の未来日はschedule不可。実際の公開後に記録する");
    if (e.startedAt === start && e.evaluateAt) { console.log(`schedule: ${id} は同日で設定済み`); return; }
    if (e.verdict !== "pending" || e.result != null || e.startedAt != null || e.evaluateAt != null) reject("設定済みの公開日・観測履歴は変更不可。別実験で記録する");
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

  const reviewIdx = args.indexOf("--launch-review");
  if (reviewIdx >= 0) {
    const e = ex.experiments.find((x) => x.experimentId === args[reviewIdx + 1]);
    const decision = args[reviewIdx + 2];
    const evidence = args[args.indexOf("--evidence") >= 0 ? args.indexOf("--evidence") + 1 : -1];
    const note = args[args.indexOf("--note") >= 0 ? args.indexOf("--note") + 1 : -1];
    if (!e || e.changeType !== "launch" || e.verdict !== "pending") reject("未判定のlaunch実験が必要");
    if (!["continue", "improve", "hold"].includes(decision) || !evidence?.trim() || !note?.trim()) reject("continue|improve|hold と --evidence / --note が必要");
    const observation = latestObservation(e, "d56");
    if (!validDate(e.evaluateAt?.d56) || e.evaluateAt.d56 > today || !observation) reject("d56期日と観測が必要");
    const assessment = assessCheckpoint(e, "d56", observation);
    if (decision === "continue" && assessment.status !== "launch-observed") reject("continueには適合する公開後56日窓が必要");
    e.result.launchReview = { reviewedAt: today, decision, observedAt: observation.observedAt, assessment, evidenceRefs: [evidence], note };
    e.result.baselineCandidate = launchBaselineCandidate(e, observation);
    e.verdict = "launch-reviewed";
    fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
    console.log(`launch review: ${e.experimentId} → ${decision}（因果効果の確定ではない）`);
    return;
  }

  const vIdx = args.indexOf("--verdict");
  if (vIdx >= 0) {
    // ── verdict 確定モード ──
    const id = args[vIdx + 1];
    const verdict = args[vIdx + 2];
    const e = ex.experiments.find((x) => x.experimentId === id);
    if (!e) { console.error(`✗ ${id} が experiments.json に無い`); process.exit(1); }
    if (!VERDICTS.has(verdict) || ["pending", "launch-reviewed"].includes(verdict)) { console.error(`✗ verdict 不正: ${verdict} (${[...VERDICTS].join("|")})`); process.exit(1); }
    if (!e.result?.d7 && !e.result?.d28 && !e.result?.d56) {
      console.error(`✗ ${id}: result が空 — 先に --check で期日到達分の実測を記録すること`);
      process.exit(1);
    }
    if (verdict.startsWith("effect-")) {
      if (e.changeType === "launch") reject("launch は公開前baselineが無いため effect/* を確定できない。--launch-review を使う");
      const assessment = assessCheckpoint(e, "d56", latestObservation(e, "d56"));
      if (!validDate(e.evaluateAt?.d56) || e.evaluateAt.d56 > today || assessment.status !== "eligible") {
        console.error(`✗ ${id}: effect/* は公開後の適合する d56 実測と比較可能な baseline が必要。d7=品質 / d28=暫定。insufficient-data: ${assessment.reasons.join(", ")}`);
        process.exit(1);
      }
      if (assessment.constraints.length) console.log(`制約: ${assessment.constraints.join("; ")}`);
    }
    const evIdx = args.indexOf("--evidence");
    if (verdict.startsWith("effect-") && !(e.evidenceRefs?.some((ref) => typeof ref === "string" && ref.trim()) || args[evIdx >= 0 ? evIdx + 1 : -1]?.trim())) {
      console.error(`✗ ${id}: effect/* の確定には --evidence または既存 evidenceRefs が必要`);
      process.exit(1);
    }
    e.verdict = verdict;
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
      const theme = byTheme.get(e.themeKey);
      const observation = observeCheckpoint(e, cp, theme, today);
      if (!recordCheckpoint(e, cp, observation)) continue;
      recorded++;
      console.log(`記録: ${e.experimentId} ${cp} (${observation.status})`);
      if (observation.reasons?.length) console.log(`  制限: ${observation.reasons.join(", ")}`);
      for (const [k, v] of Object.entries(observation.values)) {
        const base = e.baseline?.[k];
        console.log(`  ${k}: baseline ${base ?? "—"} → ${v.value ?? `null (${v.status})`}`);
      }
    }
  }
  fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
  const pending = ex.experiments.filter((x) => x.verdict === "pending").length;
  console.log(`pending ${pending} 件 / 期日到達 ${due} / 今回記録 ${recorded}`);
  if (recorded > 0) console.log("→ d28 は暫定。適合する d56 実測と baseline が揃った場合だけ --verdict で effect 判定できる (根拠 ref 必須)");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
