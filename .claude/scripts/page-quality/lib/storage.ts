import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { AuditRun, MetricKey, PageAuditResult, Violation } from "../types";
import { PROJECT_ROOT } from "./thresholds";

export const STATE_DIR = join(PROJECT_ROOT, ".claude/state/metrics/page-quality");
export const HISTORY_CSV = join(STATE_DIR, "history.csv");
export const LATEST_JSON = join(STATE_DIR, "latest.json");
export const LATEST_MD = join(STATE_DIR, "LATEST.md");
/** 週次全件監査のテンプレート別集計 (git に残す小さな履歴)。 */
export const WEEKLY_SUMMARY_CSV = join(STATE_DIR, "weekly-summary.csv");

/**
 * 週次全件監査の生データの置き場 (R2 `state/page-quality/`)。全 6,000 URL 超の結果は 10MB になり、
 * git に置くとリポジトリ衛生の 1MB 上限を超えて毎週膨らむ (2026-09-23 の初回完了で発覚)。
 * 書き手は CI だけ。ローカルで読むときは `npm run state:pull -- page-quality` → `.claude/state/page-quality/live/`。
 */
export const R2_STATE_PREFIX = "state/page-quality";
export const R2_STAGE_DIR = join(PROJECT_ROOT, ".local/r2", R2_STATE_PREFIX);
export const LIVE_DIR = join(PROJECT_ROOT, ".claude/state/page-quality/live");
/** R2 の URL ごとの履歴は直近この日数だけ残す (delta_pct 判定は直前の値しか使わない)。 */
const FULL_HISTORY_KEEP_DAYS = 84;

const HISTORY_COLUMNS = [
  "date",
  "mode",
  "url",
  "template",
  "html_bytes",
  "rsc_bytes",
  "dom_nodes",
  "duplicate_link_ratio",
  "jsonld_bytes",
  "jsonld_syntax_errors",
  "ad_duplicate_count",
  "lcp_ms",
  "cls",
  "console_errors",
  "violations_error",
  "violations_warning",
] as const;

function numOrEmpty(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && "value" in (value as object)) return ""; // unmeasured
  if (typeof value === "boolean") return value ? "1" : "0";
  return String(value);
}

function ensureDirs(): void {
  mkdirSync(STATE_DIR, { recursive: true });
}

/** history.csv へ追記する。1URL 1行、runごとに追記 (時系列)。keepDays を渡すとそれより古い行を落とす。 */
export function appendHistory(run: AuditRun, historyPath: string = HISTORY_CSV, keepDays?: number): void {
  mkdirSync(dirname(historyPath), { recursive: true });
  const violationsByUrl = new Map<string, Violation[]>();
  for (const v of run.violations) {
    const list = violationsByUrl.get(v.url) ?? [];
    list.push(v);
    violationsByUrl.set(v.url, list);
  }

  const rows = run.results.map((r) => {
    const vs = violationsByUrl.get(r.url) ?? [];
    const errorCount = vs.filter((v) => v.severity === "error").length;
    const warnCount = vs.filter((v) => v.severity === "warning").length;
    return HISTORY_COLUMNS.map((col) => {
      switch (col) {
        case "date":
          return run.generated_at.slice(0, 10);
        case "mode":
          return run.mode;
        case "url":
          return r.path;
        case "template":
          return r.template;
        case "violations_error":
          return String(errorCount);
        case "violations_warning":
          return String(warnCount);
        default:
          return numOrEmpty(r.metrics[col as MetricKey]);
      }
    }).join(",");
  });

  const header = HISTORY_COLUMNS.join(",");
  const cutoff = keepDays ? new Date(Date.parse(run.generated_at) - keepDays * 86_400_000).toISOString().slice(0, 10) : null;
  const previousRows = existsSync(historyPath)
    ? readFileSync(historyPath, "utf-8").trim().split("\n").slice(1).filter((line) => line && (!cutoff || line.slice(0, 10) >= cutoff))
    : [];
  writeFileSync(historyPath, `${[header, ...previousRows, ...rows].join("\n")}\n`, "utf-8");
}

/** history.csv から、指定URL・metric_keyの直近値 (今回runより前) を引く。delta_pct判定用。 */
export function readPreviousValue(
  url: string,
  metricKey: MetricKey,
  excludeDate: string,
  historyPath: string = HISTORY_CSV
): number | null {
  if (!existsSync(historyPath)) return null;
  const lines = readFileSync(historyPath, "utf-8").trim().split("\n");
  if (lines.length < 2) return null;
  const header = lines[0].split(",");
  const colIndex = header.indexOf(metricKey);
  const urlIndex = header.indexOf("url");
  const dateIndex = header.indexOf("date");
  if (colIndex === -1 || urlIndex === -1) return null;

  const path = (() => {
    try {
      return new URL(url).pathname + new URL(url).search;
    } catch {
      return url;
    }
  })();

  for (let i = lines.length - 1; i >= 1; i--) {
    const cols = lines[i].split(",");
    if (cols[urlIndex] !== path) continue;
    if (cols[dateIndex] === excludeDate) continue;
    const value = cols[colIndex];
    if (value === "" || value === undefined) continue;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function writeLatestJson(run: AuditRun, path: string = LATEST_JSON): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(run)}\n`, "utf-8");
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: { "cache-control": "no-cache" } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/**
 * 週次全件監査の前回結果 (latest.json / history.csv) を R2 公開 URL から stage へ取得する。
 * 取得できなければ初回扱い (前回比の判定と新規 UI 違反の比較をしない)。
 */
export async function pullFullState(publicBase = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp"): Promise<AuditRun | null> {
  mkdirSync(R2_STAGE_DIR, { recursive: true });
  const [latest, history] = await Promise.all([
    fetchText(`${publicBase}/${R2_STATE_PREFIX}/latest.json`),
    fetchText(`${publicBase}/${R2_STATE_PREFIX}/history.csv`),
  ]);
  if (history) writeFileSync(join(R2_STAGE_DIR, "history.csv"), history, "utf-8");
  if (!latest) return null;
  try {
    return JSON.parse(latest) as AuditRun;
  } catch {
    return null;
  }
}

/** 週次全件監査の生データを R2 stage へ書く (CI の diff-push-r2 が push する)。 */
export function writeFullState(run: AuditRun): void {
  writeLatestJson(run, join(R2_STAGE_DIR, "latest.json"));
  appendHistory(run, join(R2_STAGE_DIR, "history.csv"), FULL_HISTORY_KEEP_DAYS);
  // 公開 R2 は list できないので state:pull 用の一覧を置く (state-pull.mjs の規約)。
  writeFileSync(join(R2_STAGE_DIR, "index.json"), `${JSON.stringify(["latest.json", "history.csv"])}\n`, "utf-8");
}

/** git に残すテンプレート別の週次集計 (1 週 11 行程度)。 */
export function appendWeeklySummary(run: AuditRun): void {
  ensureDirs();
  const date = run.generated_at.slice(0, 10);
  const header = "date,template,urls,errors,warnings";
  const byTemplate = new Map<string, { urls: number; errors: number; warnings: number }>();
  for (const r of run.results) {
    const t = byTemplate.get(r.template) ?? { urls: 0, errors: 0, warnings: 0 };
    t.urls += 1;
    byTemplate.set(r.template, t);
  }
  for (const v of run.violations) {
    const t = byTemplate.get(v.template);
    if (!t) continue;
    if (v.severity === "error") t.errors += 1;
    else t.warnings += 1;
  }
  const previous = existsSync(WEEKLY_SUMMARY_CSV)
    ? readFileSync(WEEKLY_SUMMARY_CSV, "utf-8").trim().split("\n").slice(1).filter((l) => l && !l.startsWith(`${date},`))
    : [];
  const rows = [...byTemplate].map(([t, c]) => `${date},${t},${c.urls},${c.errors},${c.warnings}`);
  writeFileSync(WEEKLY_SUMMARY_CSV, `${[header, ...previous, ...rows].join("\n")}\n`, "utf-8");
}

/** LATEST.md の違反表の上限。全件 (週次は数千件) を載せると 1MB 近くになる。 */
const MAX_VIOLATIONS_IN_MD = 100;

export function writeLatestMarkdown(run: AuditRun): void {
  ensureDirs();
  const errorCount = run.violations.filter((v) => v.severity === "error").length;
  const warnCount = run.violations.filter((v) => v.severity === "warning").length;
  const byTemplate = new Map<string, PageAuditResult[]>();
  for (const r of run.results) {
    const list = byTemplate.get(r.template) ?? [];
    list.push(r);
    byTemplate.set(r.template, list);
  }

  const lines: string[] = [];
  lines.push(`# ページ品質監査 Latest — ${run.generated_at.slice(0, 10)}`);
  lines.push("");
  lines.push(`- モード: ${run.mode} / 対象 ${run.results.length} URL / commit ${run.commit_sha ?? "-"}`);
  lines.push(`- 違反: **error ${errorCount} / warning ${warnCount}**`);
  lines.push("");
  lines.push("## テンプレート別集計");
  lines.push("");
  lines.push("| テンプレート | URL数 | error | warning |");
  lines.push("|---|---|---|---|");
  for (const [template, results] of byTemplate) {
    const urls = new Set(results.map((r) => r.url));
    const vs = run.violations.filter((v) => v.template === template);
    lines.push(
      `| ${template} | ${urls.size} | ${vs.filter((v) => v.severity === "error").length} | ${vs.filter((v) => v.severity === "warning").length} |`
    );
  }
  lines.push("");

  if (run.violations.length > 0) {
    const shown = [...run.violations]
      .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1))
      .slice(0, MAX_VIOLATIONS_IN_MD);
    lines.push("## 違反の詳細");
    lines.push("");
    if (run.violations.length > shown.length) {
      lines.push(
        `上位 ${shown.length} 件 (error を先に) / 全 ${run.violations.length} 件。全件は ${run.mode === "full" ? "R2 `state/page-quality/latest.json` (`npm run state:pull -- page-quality`)" : "latest.json"}。`
      );
      lines.push("");
    }
    lines.push("| URL | metric | 実測 | 前回 | 閾値 | 種別 |");
    lines.push("|---|---|---|---|---|---|");
    for (const v of shown) {
      const path = (() => {
        try {
          return new URL(v.url).pathname;
        } catch {
          return v.url;
        }
      })();
      const mark = v.severity === "error" ? "🚨" : "⚠️";
      lines.push(
        `| \`${path}\` | ${v.metric_key} (${v.comparison}) | ${v.actual} | ${v.previous ?? "-"} | ${v.operator} ${v.threshold} | ${mark} |`
      );
    }
    lines.push("");
  } else {
    lines.push("## 違反の詳細");
    lines.push("");
    lines.push("なし — 全URLが全閾値を満たしています。");
    lines.push("");
  }

  const withShots = run.results.filter((r) => (r.screenshots ?? []).length > 0);
  if (withShots.length > 0) {
    const base = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
    lines.push("## 代表URLのスクショ (先週比の変化)");
    lines.push("");
    lines.push("| テンプレート | 端末 | 先週比 | スクショ |");
    lines.push("|---|---|---|---|");
    for (const r of withShots) {
      for (const s of r.screenshots ?? []) {
        const change = s.changeRatio == null ? "比較元なし" : `${Math.round(s.changeRatio * 100)}%`;
        lines.push(`| ${r.template} | ${s.device} | ${change} | [${s.key.split("/").pop()}](${base}/${s.key}) |`);
      }
    }
    lines.push("");
  }

  const withFindings = run.results.filter((r) => (r.ui_findings ?? []).length > 0);
  if (withFindings.length > 0) {
    lines.push("## UI 指摘の場所");
    lines.push("");
    for (const r of withFindings.slice(0, 50)) {
      lines.push(`- \`${r.path}\``);
      for (const finding of r.ui_findings ?? []) lines.push(`  - ${finding.replace(/\|/g, "\\|")}`);
    }
    if (withFindings.length > 50) lines.push(`- ほか ${withFindings.length - 50} URL (latest.json の ui_findings を参照)`);
    lines.push("");
  }

  writeFileSync(LATEST_MD, lines.join("\n"), "utf-8");
}

export function readLatestJson(path: string = LATEST_JSON): AuditRun | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as AuditRun;
}
