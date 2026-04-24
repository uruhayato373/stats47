/**
 * PSI しきい値チェック
 *
 * .claude/state/metrics/psi/psi-batch-*.json の最新を読み、
 * .claude/skills/analytics/performance-improvement/budgets.json と比較して violations を出す。
 *
 * Usage:
 *   node .claude/scripts/psi/psi-threshold-check.mjs
 *   node .claude/scripts/psi/psi-threshold-check.mjs --output /tmp/report.md
 *
 * Exit code:
 *   0 = error 違反なし（warning のみは 0）
 *   1 = error 違反あり
 *   2 = 入力不備
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const BUDGETS_PATH = join(
  PROJECT_ROOT,
  ".claude/skills/analytics/performance-improvement/budgets.json"
);
const STATE_DIR = join(PROJECT_ROOT, ".claude/state/metrics/psi");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { output: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output") opts.output = args[++i];
  }
  return opts;
}

function loadBudgets() {
  const raw = JSON.parse(readFileSync(BUDGETS_PATH, "utf-8"));
  return raw.budgets || [];
}

function loadLatestBatch() {
  const files = readdirSync(STATE_DIR)
    .filter((f) => f.startsWith("psi-batch-") && f.endsWith(".json"))
    .sort()
    .reverse();
  if (files.length === 0) {
    throw new Error(`No psi-batch-*.json files in ${STATE_DIR}`);
  }
  const latest = files[0];
  const data = JSON.parse(readFileSync(join(STATE_DIR, latest), "utf-8"));
  return { file: latest, results: data.results || [], generated_at: data.generated_at };
}

// URL → page_type 推定
function inferPageType(url) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  if (path === "/" || path === "") return "homepage";
  if (path.startsWith("/ranking/")) return "ranking";
  if (path.startsWith("/ranking")) return "ranking";
  if (path.startsWith("/areas/")) return "area";
  if (path.startsWith("/areas")) return "area";
  if (path.startsWith("/themes/")) return "theme";
  if (path.startsWith("/themes")) return "theme";
  if (path.startsWith("/blog")) return "blog";
  return "other";
}

// budgets からこの result に適用する閾値を選ぶ
// page_type 完全一致優先、無ければ "all" を使う。strategy 一致のみ。
function selectBudgetsFor(pageType, strategy, budgets) {
  const applicable = budgets.filter((b) => {
    if (b.strategy !== strategy && b.strategy !== "both") return false;
    return b.page_type === pageType || b.page_type === "all";
  });
  // metric_key ごとに page_type 一致を優先
  const byMetric = new Map();
  for (const b of applicable) {
    const existing = byMetric.get(b.metric_key);
    if (!existing) {
      byMetric.set(b.metric_key, b);
    } else if (b.page_type === pageType && existing.page_type !== pageType) {
      byMetric.set(b.metric_key, b);
    }
  }
  return [...byMetric.values()];
}

function compareOperator(actual, threshold, op) {
  switch (op) {
    case ">=":
      return actual >= threshold;
    case ">":
      return actual > threshold;
    case "<=":
      return actual <= threshold;
    case "<":
      return actual < threshold;
    default:
      return true;
  }
}

// result → metric_key → actual value
function extractMetrics(result) {
  const s = result.scores || {};
  const lab = result.lab_data || {};
  return {
    score_performance: s.performance,
    score_accessibility: s.accessibility,
    score_best_practices: s.best_practices,
    score_seo: s.seo,
    lcp_ms: lab.LCP_ms,
    cls: lab.CLS,
    tbt_ms: lab.TBT_ms,
    fcp_ms: lab.FCP_ms,
    ttfb_ms: lab.TTFB_ms,
    tti_ms: lab.TTI_ms,
    si_ms: lab.SI_ms,
  };
}

function checkViolations(results, budgets) {
  const violations = [];
  for (const r of results) {
    if (r.error) {
      violations.push({
        url: r.url,
        strategy: r.strategy,
        metric_key: "fetch_error",
        severity: "error",
        detail: r.error,
      });
      continue;
    }
    const pageType = inferPageType(r.url);
    const applicable = selectBudgetsFor(pageType, r.strategy, budgets);
    const metrics = extractMetrics(r);

    for (const b of applicable) {
      const actual = metrics[b.metric_key];
      if (actual == null) continue;
      if (!compareOperator(actual, b.threshold, b.operator)) {
        violations.push({
          url: r.url,
          strategy: r.strategy,
          page_type: pageType,
          metric_key: b.metric_key,
          operator: b.operator,
          threshold: b.threshold,
          actual: typeof actual === "number" ? Number(actual.toFixed(3)) : actual,
          severity: b.severity,
        });
      }
    }
  }
  return violations;
}

function formatMetricValue(metric_key, value) {
  if (value == null) return "-";
  if (metric_key.endsWith("_ms")) return `${Math.round(value)}ms`;
  if (metric_key === "cls") return value.toFixed(3);
  if (metric_key.startsWith("score_")) return `${value}`;
  return `${value}`;
}

function formatMarkdown(results, violations) {
  const date = new Date().toISOString().slice(0, 10);
  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warnCount = violations.filter((v) => v.severity === "warning").length;

  const lines = [];
  lines.push(`# PSI 計測レポート — ${date}`);
  lines.push("");
  lines.push(`- 計測対象: ${new Set(results.map((r) => r.url)).size} URL × ${new Set(results.map((r) => r.strategy)).size} strategy`);
  lines.push(`- しきい値違反: **error ${errorCount} / warning ${warnCount}**`);
  lines.push("");

  lines.push("## スコア・Core Web Vitals 一覧");
  lines.push("");
  lines.push("| URL | Strategy | Perf | LCP | CLS | TBT | TTFB |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of results) {
    const path = r.url.replace(/^https?:\/\/[^/]+/, "") || "/";
    if (r.error) {
      lines.push(`| ${path} | ${r.strategy} | ERROR | | | | |`);
      continue;
    }
    const m = extractMetrics(r);
    const vlist = violations.filter((v) => v.url === r.url && v.strategy === r.strategy);
    const flag = (key) => {
      const v = vlist.find((x) => x.metric_key === key);
      if (!v) return "";
      return v.severity === "error" ? "🚨" : "⚠️";
    };
    lines.push(
      `| ${path} | ${r.strategy} | ${m.score_performance ?? "-"}${flag("score_performance")} | ${formatMetricValue("lcp_ms", m.lcp_ms)}${flag("lcp_ms")} | ${formatMetricValue("cls", m.cls)}${flag("cls")} | ${formatMetricValue("tbt_ms", m.tbt_ms)}${flag("tbt_ms")} | ${formatMetricValue("ttfb_ms", m.ttfb_ms)}${flag("ttfb_ms")} |`
    );
  }
  lines.push("");

  if (violations.length > 0) {
    lines.push("## しきい値違反");
    lines.push("");
    const errorVs = violations.filter((v) => v.severity === "error");
    const warnVs = violations.filter((v) => v.severity === "warning");
    if (errorVs.length > 0) {
      lines.push(`### 🚨 error (${errorVs.length})`);
      lines.push("");
      for (const v of errorVs) {
        const path = v.url.replace(/^https?:\/\/[^/]+/, "") || "/";
        if (v.metric_key === "fetch_error") {
          lines.push(`- ❌ \`${path}\` (${v.strategy}): ${v.detail}`);
        } else {
          lines.push(
            `- \`${path}\` (${v.strategy}, ${v.page_type}): **${v.metric_key}** = ${formatMetricValue(v.metric_key, v.actual)} (閾値 ${v.operator} ${formatMetricValue(v.metric_key, v.threshold)})`
          );
        }
      }
      lines.push("");
    }
    if (warnVs.length > 0) {
      lines.push(`### ⚠️ warning (${warnVs.length})`);
      lines.push("");
      for (const v of warnVs) {
        const path = v.url.replace(/^https?:\/\/[^/]+/, "") || "/";
        lines.push(
          `- \`${path}\` (${v.strategy}, ${v.page_type}): **${v.metric_key}** = ${formatMetricValue(v.metric_key, v.actual)} (閾値 ${v.operator} ${formatMetricValue(v.metric_key, v.threshold)})`
        );
      }
      lines.push("");
    }
  } else {
    lines.push("## しきい値違反");
    lines.push("");
    lines.push("なし — 全 URL が全閾値を満たしています。");
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const opts = parseArgs();
  let budgets, batch;
  try {
    budgets = loadBudgets();
    batch = loadLatestBatch();
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(2);
  }

  const violations = checkViolations(batch.results, budgets);
  const md = formatMarkdown(batch.results, violations);

  if (opts.output) {
    writeFileSync(opts.output, md, "utf-8");
    console.error(`Report written to ${opts.output}`);
  } else {
    console.log(md);
  }

  const errorCount = violations.filter((v) => v.severity === "error").length;
  console.error(`\nViolations: error=${errorCount}, warning=${violations.length - errorCount}`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
