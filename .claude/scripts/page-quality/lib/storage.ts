import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { AuditRun, MetricKey, PageAuditResult, Violation } from "../types";
import { PROJECT_ROOT } from "./thresholds";

export const STATE_DIR = join(PROJECT_ROOT, ".claude/state/metrics/page-quality");
export const SNAPSHOTS_DIR = join(STATE_DIR, "snapshots");
export const HISTORY_CSV = join(STATE_DIR, "history.csv");
export const LATEST_JSON = join(STATE_DIR, "latest.json");
export const LATEST_MD = join(STATE_DIR, "LATEST.md");

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
  mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

/** raw run結果を .claude/state/metrics/page-quality/snapshots/<date>.json へ保存する (週次のみ・保持数は prune-state-snapshots.mjs で管理)。 */
export function saveSnapshot(run: AuditRun): string {
  ensureDirs();
  const date = run.generated_at.slice(0, 10);
  const path = join(SNAPSHOTS_DIR, `${date}.json`);
  writeFileSync(path, `${JSON.stringify(run, null, 2)}\n`, "utf-8");
  return path;
}

/** history.csv へ追記する。1URL 1行、runごとに追記 (時系列)。 */
export function appendHistory(run: AuditRun): void {
  ensureDirs();
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
  if (!existsSync(HISTORY_CSV)) {
    writeFileSync(HISTORY_CSV, `${header}\n${rows.join("\n")}\n`, "utf-8");
  } else {
    const existing = readFileSync(HISTORY_CSV, "utf-8");
    const sep = existing.endsWith("\n") ? "" : "\n";
    writeFileSync(HISTORY_CSV, `${existing}${sep}${rows.join("\n")}\n`, "utf-8");
  }
}

/** history.csv から、指定URL・metric_keyの直近値 (今回runより前) を引く。delta_pct判定用。 */
export function readPreviousValue(url: string, metricKey: MetricKey, excludeDate: string): number | null {
  if (!existsSync(HISTORY_CSV)) return null;
  const lines = readFileSync(HISTORY_CSV, "utf-8").trim().split("\n");
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

export function writeLatestJson(run: AuditRun): void {
  ensureDirs();
  writeFileSync(LATEST_JSON, `${JSON.stringify(run, null, 2)}\n`, "utf-8");
}

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
    lines.push("## 違反の詳細");
    lines.push("");
    lines.push("| URL | metric | 実測 | 前回 | 閾値 | 種別 |");
    lines.push("|---|---|---|---|---|---|");
    for (const v of run.violations) {
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

export function readLatestJson(): AuditRun | null {
  if (!existsSync(LATEST_JSON)) return null;
  return JSON.parse(readFileSync(LATEST_JSON, "utf-8")) as AuditRun;
}
