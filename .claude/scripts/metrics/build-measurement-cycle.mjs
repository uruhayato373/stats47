#!/usr/bin/env node
/**
 * 計測→記録→改善サイクルの週次 state を組み立てる (API を叩かない。入力は git 上の snapshot と監査結果)。
 *
 * Usage:
 *   node .claude/scripts/metrics/build-measurement-cycle.mjs --week 2026-W38 [--admin-audit /tmp/api-latest.json]
 *
 * 出力: .claude/state/metrics/measurement-cycle/{latest.json,LATEST.md,history.csv}
 * 呼び出し元: fetch-metrics-weekly.yml (日曜) → improvement-cycle-weekly.yml (月曜の無人 triage) と
 *            generate-weekly-metrics-issue.mjs (月曜の週次 Issue) が読む。
 * --admin-audit は google-admin audit-api の api-latest.json。README の規約で監査 state 自体は commit しないため、
 * CI は /tmp へ退避したものを渡し、ここでは登録済みパラメータ名だけを使う。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { evaluateRules, flatten } from "../cloudflare/threshold-check.mjs";
import { PROJECT_ROOT, isoWeekToDateRange, toCsv } from "./lib/auth.mjs";
import {
  countOpsImprovements, parseCsv, renderCycleMarkdown, summarizeCloudflare, summarizeDimensionGaps, summarizeEngine,
  summarizeJourney, summarizeNavCoverage, summarizeOverdue, summarizePsi, summarizeSns, summarizeWorkContext,
} from "./lib/measurement-cycle.mjs";
import { judgeability } from "./lib/gsc-improvements-adapter.mjs";
import { parseDimensionLedger } from "../google-admin/dimension-ledger.mjs";
import { parseBacklog } from "../lib/scan-pending-improvements.mjs";

const ACTIVE_STATUSES = new Set(["pending", "in-progress", "effect/pending"]);
const HISTORY_COLUMNS = [
  "week", "periodStart", "periodEnd", "blogToRankingRate", "themesToRankingRate",
  "workContextPages", "absentParams", "breakdownReadyEvents", "overdueImprovements", "gscJudgeable", "gscActive",
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function readSlice(dir, name) {
  const csvPath = join(dir, `${name}.csv`);
  const metaPath = join(dir, `${name}.meta.json`);
  if (!existsSync(csvPath)) return { status: "missing", rows: null };
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : null;
  if (meta && meta.status !== "ok") return { status: meta.status, detail: meta.error, rows: null, meta };
  return { status: "ok", rows: parseCsv(readFileSync(csvPath, "utf8")), meta };
}

const readCsvIfExists = (path) => (existsSync(path) ? parseCsv(readFileSync(path, "utf8")) : null);

/**
 * 運用系 (PSI / Cloudflare / SNS)。判定ロジックは各 source の既存実装を使い、ここで閾値を持たない:
 * PSI は日次 digest が history.csv に書いた violations_*、Cloudflare は threshold-check.mjs の evaluateRules、
 * SNS は sns-weekly-report.mjs と同じ sns-metrics-store.readByRange。
 */
function buildOperations(week, asOf, pending) {
  const psiRows = readCsvIfExists(join(PROJECT_ROOT, ".claude/state/metrics/psi/history.csv"));
  const cfDir = join(PROJECT_ROOT, ".claude/state/metrics/cloudflare");
  const cfRows = readCsvIfExists(join(cfDir, "history.csv"));
  const rules = JSON.parse(readFileSync(join(PROJECT_ROOT, ".claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json"), "utf8")).rules;
  const snapshotsDir = join(cfDir, "snapshots");
  const evaluated = existsSync(snapshotsDir)
    ? readdirSync(snapshotsDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => ({
      date: f.slice(0, 10),
      violations: evaluateRules(flatten(JSON.parse(readFileSync(join(snapshotsDir, f), "utf8"))), rules).violations,
    }))
    : [];
  const { startDate, endDate } = isoWeekToDateRange(week);
  const snsStore = createRequire(import.meta.url)("../lib/sns-metrics-store.cjs");
  return {
    psi: psiRows ? summarizePsi(psiRows, asOf) : null,
    cloudflare: cfRows ? summarizeCloudflare(cfRows, evaluated, asOf) : null,
    sns: summarizeSns(snsStore.readByRange(startDate, endDate)),
    improvements: countOpsImprovements(pending),
  };
}

function main() {
  const week = arg("--week");
  if (!/^\d{4}-W\d{2}$/.test(week ?? "")) throw new Error("--week YYYY-Www が必要");
  const asOf = isoWeekToDateRange(week).endDate;
  const snapshotDir = join(PROJECT_ROOT, ".claude/skills/analytics/ga4-improvement/reference/snapshots", week);
  const outDir = join(PROJECT_ROOT, ".claude/state/metrics/measurement-cycle");

  const transitions = readSlice(snapshotDir, "internal-transitions");
  const landing = readSlice(snapshotDir, "landing-context");
  const events = readSlice(snapshotDir, "event-volume");
  // NavClickTracker (2026-09-26) のデプロイ前の週は nav-click-surfaces.csv が無い。無ければ節を出さない
  const navClicksPath = join(snapshotDir, "nav-click-surfaces.csv");
  const navClicks = existsSync(navClicksPath) ? parseCsv(readFileSync(navClicksPath, "utf8")) : null;
  const pagesCleanPath = join(snapshotDir, "pages-clean.csv");
  const pagesClean = existsSync(pagesCleanPath) ? parseCsv(readFileSync(pagesCleanPath, "utf8")) : null;

  const auditPath = arg("--admin-audit");
  let registeredParams = null;
  let adminStatus = { status: "not-run", detail: "--admin-audit 未指定" };
  if (auditPath) {
    if (!existsSync(auditPath)) adminStatus = { status: "missing", detail: auditPath };
    else {
      const cd = JSON.parse(readFileSync(auditPath, "utf8")).audit?.customDimensions;
      if (cd?.status === "ok" && Array.isArray(cd.params)) {
        registeredParams = cd.params;
        adminStatus = { status: "ok", detail: `登録済み ${cd.count} 件` };
      } else adminStatus = { status: cd?.status ?? "unreadable", detail: "customDimensions を読めない" };
    }
  }

  const ledgerEntries = parseDimensionLedger(readFileSync(join(PROJECT_ROOT, ".claude/rules/analytics-event-standards.md"), "utf8"));
  const pending = parseBacklog(join(PROJECT_ROOT, ".claude/todo/improvements.md"), new Date(`${asOf}T00:00:00Z`))
    .filter((e) => ACTIVE_STATUSES.has(e.status));
  const verdictsPath = join(PROJECT_ROOT, ".claude/state/effect-verdict", `verdicts-${week}.json`);
  const verdicts = existsSync(verdictsPath) ? JSON.parse(readFileSync(verdictsPath, "utf8")) : null;
  const gscRows = pending.filter((e) => /gsc/i.test(e.target_metric ?? "")).map(judgeability);

  const state = {
    schemaVersion: 1,
    week,
    asOf,
    generatedAt: new Date().toISOString(),
    sources: {
      ga4: {
        status: transitions.status === "ok" && landing.status === "ok" && events.status === "ok" && pagesClean ? "ok" : "partial",
        periodStart: transitions.meta?.periodStart ?? landing.meta?.periodStart ?? null,
        periodEnd: transitions.meta?.periodEnd ?? landing.meta?.periodEnd ?? null,
        detail: `transitions=${transitions.status} landing=${landing.status} events=${events.status} pages-clean=${pagesClean ? "ok" : "missing"}`,
      },
      customDimensions: adminStatus,
      improvements: { status: "ok", detail: `active ${pending.length} 件` },
      effectVerdicts: verdicts ? { status: "ok", detail: `verdicts-${week}.json` } : { status: "missing", detail: `verdicts-${week}.json` },
    },
    engine: summarizeEngine({ verdicts, gscRows }),
    operations: buildOperations(week, asOf, pending),
    journey: transitions.rows && pagesClean ? summarizeJourney({ transitions: transitions.rows, pagesClean }) : null,
    navCoverage: transitions.rows && navClicks ? summarizeNavCoverage({ transitions: transitions.rows, navClicks }) : null,
    workContext: landing.rows ? summarizeWorkContext(landing.rows) : null,
    dimensionGaps: registeredParams && events.rows
      ? summarizeDimensionGaps({ ledgerEntries, registeredParams, eventVolume: events.rows })
      : null,
    improvements: summarizeOverdue(pending, asOf),
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "latest.json"), JSON.stringify(state, null, 2) + "\n");
  writeFileSync(join(outDir, "LATEST.md"), `# 計測→記録→改善サイクル — ${week}\n\n${renderCycleMarkdown(state)}\n`);

  const historyPath = join(outDir, "history.csv");
  const history = existsSync(historyPath) ? parseCsv(readFileSync(historyPath, "utf8")).filter((r) => r.week !== week) : [];
  history.push({
    week,
    periodStart: state.sources.ga4.periodStart ?? "",
    periodEnd: state.sources.ga4.periodEnd ?? "",
    blogToRankingRate: state.journey?.blogToRanking.rate ?? "",
    themesToRankingRate: state.journey?.themesToRanking.rate ?? "",
    workContextPages: state.workContext?.top.length ?? "",
    absentParams: state.dimensionGaps?.absentParams ?? "",
    breakdownReadyEvents: state.dimensionGaps?.groups.filter((g) => g.breakdownReady).length ?? "",
    overdueImprovements: state.improvements.overdue.length,
    gscJudgeable: state.engine.gsc.judgeable,
    gscActive: state.engine.gsc.active,
  });
  history.sort((a, b) => a.week.localeCompare(b.week));
  writeFileSync(historyPath, toCsv(history, HISTORY_COLUMNS));
  console.log(`[measurement-cycle] ${week} → ${outDir} (ga4=${state.sources.ga4.status} dims=${adminStatus.status} overdue=${state.improvements.overdue.length})`);
}

main();
