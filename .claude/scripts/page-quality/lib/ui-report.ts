import { readFileSync } from "node:fs";

import type { AuditRun, MetricKey, PageAuditResult, ScreenshotRecord, Violation } from "../types";

/** UI 検査の指標。新規発生の通知対象 (肥大化・重複の既存指標は page-quality-alert が扱う)。 */
export const UI_METRIC_KEYS: MetricKey[] = [
  "broken_images",
  "degraded_images",
  "empty_headings",
  "duplicate_data_source_sections",
  "external_links_same_tab",
  "clipped_text",
  "overlapping_tap_targets",
  "chart_text_issues",
  "blog_svg_text_issues",
  "a11y_violations",
  "responsive_layout_issues",
];

/** 前回の週次結果に無かった UI 違反。前回が無ければ全件を新規として返す。 */
export function newUiViolations(current: AuditRun, previous: AuditRun | null): { violations: Violation[]; firstRun: boolean } {
  const ui = current.violations.filter((v) => UI_METRIC_KEYS.includes(v.metric_key));
  if (!previous) return { violations: ui, firstRun: true };
  const seen = new Set(previous.violations.map((v) => `${v.url}|${v.metric_key}`));
  return { violations: ui.filter((v) => !seen.has(`${v.url}|${v.metric_key}`)), firstRun: false };
}

export interface ReviewInputPage {
  template: string;
  url: string;
  screenshots: Array<Pick<ScreenshotRecord, "device" | "localPath" | "changeRatio" | "height" | "tilePaths">>;
  automatedFindings: string[];
}

export interface ReviewInput {
  generatedAt: string;
  pages: ReviewInputPage[];
}

/** agent に渡す入力。スクショのローカルパスと、機械検査が既に見つけた指摘 (重複報告を避けるため)。 */
/**
 * agent に渡す確認対象。`reviewKeys` を渡すとその週に確認するページ (`reviewPageKeys()`) だけに絞る。
 * `template` にはページの識別子 (`page_key`。variants は `<template>--<id>`) を入れ、指摘・撮影ファイル名と揃える。
 */
export function buildReviewInput(run: AuditRun, reviewKeys?: readonly string[]): ReviewInput {
  const keep = reviewKeys ? new Set(reviewKeys) : null;
  return {
    generatedAt: run.generated_at,
    pages: run.results
      .filter((r): r is PageAuditResult & { screenshots: ScreenshotRecord[] } => (r.screenshots ?? []).length > 0)
      .filter((r) => !keep || keep.has(r.page_key ?? r.template))
      .map((r) => ({
        template: r.page_key ?? r.template,
        url: r.url,
        screenshots: r.screenshots.map(({ device, localPath, changeRatio, height, tilePaths }) => ({
          device,
          localPath,
          changeRatio,
          height,
          tilePaths,
        })),
        automatedFindings: r.ui_findings ?? [],
      })),
  };
}

export type ReviewSeverity = "high" | "medium" | "low";

export interface ReviewFinding {
  template: string;
  /** agent が確認した幅の id (`mobile-390` / `tablet-768` / `desktop-1440`)。 */
  device: string;
  severity: ReviewSeverity;
  location: string;
  issue: string;
  suggestion: string;
}

export interface ReviewReport {
  status: "reviewed" | "no-issues" | "blocked";
  summary: string;
  findings: ReviewFinding[];
}

/** agent の出力を入力と突き合わせる。存在しない画面を指す指摘や形の崩れた指摘は採用しない。 */
export function validateReview(raw: unknown, input: ReviewInput): { report: ReviewReport; rejected: string[] } {
  const rejected: string[] = [];
  const r = raw as Partial<ReviewReport> | null;
  if (!r || typeof r !== "object" || !["reviewed", "no-issues", "blocked"].includes(String(r.status))) {
    throw new Error("review output has no valid status");
  }
  // agent に見せたのは切り出しのある幅だけ。それ以外の幅を指す指摘は見ていない画面なので捨てる。
  const shots = new Set(
    input.pages.flatMap((p) => p.screenshots.filter((s) => (s.tilePaths ?? []).length > 0).map((s) => `${p.template}|${s.device}`))
  );
  const findings: ReviewFinding[] = [];
  for (const f of Array.isArray(r.findings) ? r.findings : []) {
    const key = `${f?.template}|${f?.device}`;
    if (!shots.has(key)) {
      rejected.push(`撮影していない画面を指す指摘: ${key}`);
      continue;
    }
    if (!["high", "medium", "low"].includes(String(f.severity)) || !f.issue || !f.location) {
      rejected.push(`形の崩れた指摘: ${key}`);
      continue;
    }
    findings.push(f);
  }
  return { report: { status: r.status as ReviewReport["status"], summary: String(r.summary ?? ""), findings }, rejected };
}

const SEVERITY_LABEL: Record<ReviewSeverity, string> = { high: "🔴 高", medium: "🟡 中", low: "🟢 低" };

/** 通知 Issue の本文。新規の機械検出と agent の指摘のどちらも無ければ null (Issue を閉じる)。 */
export function buildUiAlert(params: {
  date: string;
  newViolations: Violation[];
  firstRun: boolean;
  review: ReviewReport | null;
  reviewError: string | null;
  input: ReviewInput;
  screenshotBaseUrl: string;
  keyOf: (template: string, device: string) => string;
}): string | null {
  const { newViolations, review } = params;
  const reviewFindings = review?.findings ?? [];
  if (newViolations.length === 0 && reviewFindings.length === 0 && !params.reviewError) return null;

  const lines: string[] = [];
  lines.push(`## ページ UI の週次確認 (${params.date})`);
  lines.push("");
  lines.push("直すと決めたものはバックログ (`.claude/todo/backlog.md`) へカードにする。正典: `.claude/rules/page-quality-standards.md`");
  lines.push("");

  lines.push(`### 機械検査で新しく見つかったもの${params.firstRun ? " (初回のため全件)" : " (先週は無かったもの)"}`);
  lines.push("");
  if (newViolations.length === 0) lines.push("なし");
  for (const v of newViolations.slice(0, 40)) {
    const path = (() => {
      try {
        return new URL(v.url).pathname;
      } catch {
        return v.url;
      }
    })();
    lines.push(`- \`${path}\` ${v.metric_key} = ${v.actual} (${v.severity})`);
  }
  if (newViolations.length > 40) lines.push(`- ほか ${newViolations.length - 40} 件 (LATEST.md を参照)`);
  lines.push("");

  lines.push("### スクショを見た agent の指摘");
  lines.push("");
  if (params.reviewError) lines.push(`agent の確認は実行できなかった: ${params.reviewError}`);
  else if (reviewFindings.length === 0) lines.push(`なし (${review?.summary ?? ""})`);
  for (const f of [...reviewFindings].sort((a, b) => ["high", "medium", "low"].indexOf(a.severity) - ["high", "medium", "low"].indexOf(b.severity))) {
    const shot = `${params.screenshotBaseUrl}/${params.keyOf(f.template, f.device)}`;
    lines.push(`- ${SEVERITY_LABEL[f.severity]} **${f.template} / ${f.device}** — ${f.location}: ${f.issue}`);
    lines.push(`  - 案: ${f.suggestion} ([スクショ](${shot}))`);
  }
  lines.push("");

  const changed = params.input.pages
    .flatMap((p) => p.screenshots.map((s) => ({ template: p.template, device: s.device, ratio: s.changeRatio })))
    .filter((s) => s.ratio != null && s.ratio >= 0.2)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
  if (changed.length > 0) {
    lines.push("### 先週から見た目が大きく変わった画面 (画素の 20% 以上)");
    lines.push("");
    for (const c of changed) lines.push(`- ${c.template} / ${c.device}: ${Math.round((c.ratio ?? 0) * 100)}%`);
    lines.push("");
  }
  return lines.join("\n");
}

/** claude-code-base-action の execution file (JSON 配列) から最後の成功結果の構造化出力を取り出す。 */
export function structuredOutput(executionPath: string): unknown {
  const entries = JSON.parse(readFileSync(executionPath, "utf-8")) as Array<Record<string, unknown>>;
  if (!Array.isArray(entries)) throw new Error("execution file is not an array");
  const result = [...entries].reverse().find((e) => e.type === "result");
  if (!result || result.subtype !== "success" || result.is_error) throw new Error("review execution did not succeed");
  if (!result.structured_output) throw new Error("review execution has no structured_output");
  return result.structured_output;
}
