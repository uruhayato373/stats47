import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  Budget,
  BudgetsFile,
  MetricKey,
  MetricValue,
  PageAuditResult,
  PageTemplateKey,
  Severity,
  Violation,
} from "../types";

const HERE = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(HERE, "..", "..", "..", "..");
export const BUDGETS_PATH = join(
  PROJECT_ROOT,
  ".claude/skills/analytics/performance-improvement/page-quality-budgets.json"
);

export function loadBudgets(path: string = BUDGETS_PATH): Budget[] {
  const raw = JSON.parse(readFileSync(path, "utf-8")) as BudgetsFile;
  return raw.budgets;
}

function budgetsFor(pageType: PageTemplateKey, budgets: Budget[]): Budget[] {
  const applicable = budgets.filter(
    (b) => b.page_type === pageType || b.page_type === "all"
  );
  // metric_key + comparison + severity ごとに page_type 完全一致を優先する。
  // severityをキーに含めるのは、同じmetric_keyにwarning/errorの2段閾値を
  // 両方持たせられるようにするため (例: duplicate_link_ratio warning=0.15 / error=0.3)。
  const byKey = new Map<string, Budget>();
  for (const b of applicable) {
    const key = `${b.metric_key}::${b.comparison}::${b.severity}`;
    const existing = byKey.get(key);
    if (!existing || (b.page_type === pageType && existing.page_type !== pageType)) {
      byKey.set(key, b);
    }
  }
  return [...byKey.values()];
}

function compare(actual: number, threshold: number, op: Budget["operator"]): boolean {
  switch (op) {
    case "<=":
      return actual <= threshold;
    case "<":
      return actual < threshold;
    case ">=":
      return actual >= threshold;
    case ">":
      return actual > threshold;
  }
}

function isUnmeasured(value: MetricValue | undefined): value is { value: null; reason: string } {
  return value != null && typeof value === "object" && "value" in value && value.value === null;
}

function numericValue(value: MetricValue | undefined): number | null {
  if (value == null) return null;
  if (isUnmeasured(value)) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

/**
 * 直近の履歴 (同一 url) から、metric_key の直前値を引く。delta_pct 判定に使う。
 * 見つからなければ null (=初回計測、delta判定はskip)。
 */
export type PreviousLookup = (url: string, metricKey: MetricKey) => number | null;

export function evaluateResult(
  result: PageAuditResult,
  budgets: Budget[],
  previous: PreviousLookup
): Violation[] {
  if (result.expected_redirect_or_gone) return [];
  const violations: Violation[] = [];

  if (result.error || (result.http_status != null && result.http_status >= 400)) {
    violations.push({
      url: result.url,
      template: result.template,
      metric_key: "http_status",
      comparison: "absolute",
      operator: "<",
      threshold: 400,
      actual: result.http_status ?? -1,
      previous: null,
      severity: "error",
    });
  }

  const applicable = budgetsFor(result.template, budgets);
  // 同じ metric_key+comparison に warning/error の2段階がある場合、両方が違反しても
  // より厳しい方 (error) だけを報告する (severity降順に並べ、グループごとに最初の1件で打ち切る)。
  const severityRank: Record<Severity, number> = { error: 0, warning: 1 };
  const sorted = [...applicable].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const reportedGroups = new Set<string>();

  for (const budget of sorted) {
    const groupKey = `${budget.metric_key}::${budget.comparison}`;
    if (reportedGroups.has(groupKey)) continue;
    const actual = numericValue(result.metrics[budget.metric_key]);
    if (actual == null) continue;

    if (budget.comparison === "absolute") {
      if (!compare(actual, budget.threshold, budget.operator)) {
        violations.push({
          url: result.url,
          template: result.template,
          metric_key: budget.metric_key,
          comparison: "absolute",
          operator: budget.operator,
          threshold: budget.threshold,
          actual,
          previous: null,
          severity: budget.severity,
        });
        reportedGroups.add(groupKey);
      }
      continue;
    }

    // delta_pct: 直近値からの増加率(%)を見る。履歴が無ければ判定をskipする(初回計測を退行扱いしない)。
    const prev = previous(result.url, budget.metric_key);
    if (prev == null || prev === 0) continue;
    const deltaPct = ((actual - prev) / prev) * 100;
    if (!compare(deltaPct, budget.threshold, budget.operator)) {
      reportedGroups.add(groupKey);
      violations.push({
        url: result.url,
        template: result.template,
        metric_key: budget.metric_key,
        comparison: "delta_pct",
        operator: budget.operator,
        threshold: budget.threshold,
        actual: Number(deltaPct.toFixed(1)),
        previous: prev,
        severity: budget.severity,
      });
    }
  }

  return violations;
}

export function evaluateAll(
  results: PageAuditResult[],
  budgets: Budget[],
  previous: PreviousLookup
): Violation[] {
  return results.flatMap((r) => evaluateResult(r, budgets, previous));
}
