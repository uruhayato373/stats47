import "server-only";

import { cached, fileExists, readCsv, readJson, TTL } from "./state-io";

// 週次全件の結果は R2 state/page-quality/ にあり、`npm run state:pull -- page-quality` で live/ に取得する。
// live/ が無ければ git の代表URL結果 (page-quality:check) を読む。
const LIVE_LATEST_PATH = ".claude/state/page-quality/live/latest.json";
const LIVE_HISTORY_PATH = ".claude/state/page-quality/live/history.csv";
const GIT_LATEST_PATH = ".claude/state/metrics/page-quality/latest.json";
const GIT_HISTORY_PATH = ".claude/state/metrics/page-quality/history.csv";
const pick = (live: string, git: string) => (fileExists(live) ? live : git);

export type MetricValue = number | boolean | { value: null; reason: string } | undefined;

export interface PageAuditResultRow {
  url: string;
  path: string;
  template: string;
  http_status: number | null;
  error: string | null;
  metrics: Record<string, MetricValue>;
}

export interface ViolationRow {
  url: string;
  template: string;
  metric_key: string;
  comparison: string;
  operator: string;
  threshold: number;
  actual: number;
  previous: number | null;
  severity: "error" | "warning";
}

export interface PageQualityLatest {
  schemaVersion: 1;
  mode: "representative" | "full";
  generated_at: string;
  commit_sha: string | null;
  environment: string;
  results: PageAuditResultRow[];
  violations: ViolationRow[];
}

export interface HistoryPoint {
  date: string;
  errorCount: number;
  warningCount: number;
}

/** history.csv から日別のerror/warning件数を集計する (トレンド表示用)。 */
function readHistoryTrend(limit = 30): HistoryPoint[] {
  const HISTORY_PATH = pick(LIVE_HISTORY_PATH, GIT_HISTORY_PATH);
  if (!fileExists(HISTORY_PATH)) return [];
  const rows = readCsv(HISTORY_PATH);
  const byDate = new Map<string, { error: number; warning: number }>();
  for (const row of rows) {
    const date = String(row.date ?? "");
    if (!date) continue;
    const entry = byDate.get(date) ?? { error: 0, warning: 0 };
    entry.error += Number(row.violations_error || 0);
    entry.warning += Number(row.violations_warning || 0);
    byDate.set(date, entry);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([date, v]) => ({ date, errorCount: v.error, warningCount: v.warning }));
}

export interface TemplateRollup {
  template: string;
  urlCount: number;
  errorCount: number;
  warningCount: number;
}

export interface OffenderRow {
  url: string;
  path: string;
  template: string;
  errorCount: number;
  warningCount: number;
  violations: ViolationRow[];
}

export interface PageQualitySummary {
  ok: boolean;
  error?: string;
  generatedAt?: string;
  mode?: string;
  commitSha?: string | null;
  environment?: string;
  totalUrls: number;
  successCount: number;
  warningOnlyCount: number;
  errorCount: number;
  templateRollups: TemplateRollup[];
  worstOffenders: OffenderRow[];
  trend: HistoryPoint[];
  results: PageAuditResultRow[];
  violations: ViolationRow[];
}

function emptySummary(error: string): PageQualitySummary {
  return {
    ok: false,
    error,
    totalUrls: 0,
    successCount: 0,
    warningOnlyCount: 0,
    errorCount: 0,
    templateRollups: [],
    worstOffenders: [],
    trend: readHistoryTrend(),
    results: [],
    violations: [],
  };
}

function buildSummary(): PageQualitySummary {
  const LATEST_PATH = pick(LIVE_LATEST_PATH, GIT_LATEST_PATH);
  if (!fileExists(LATEST_PATH)) {
    return emptySummary("latest.json が見つかりません (page-quality:check 未実行)");
  }
  let latest: PageQualityLatest;
  try {
    latest = readJson<PageQualityLatest>(LATEST_PATH);
  } catch (e) {
    return emptySummary(`latest.json の読み込みに失敗: ${(e as Error).message}`);
  }

  const violationsByUrl = new Map<string, ViolationRow[]>();
  for (const v of latest.violations) {
    const list = violationsByUrl.get(v.url) ?? [];
    list.push(v);
    violationsByUrl.set(v.url, list);
  }

  let successCount = 0;
  let warningOnlyCount = 0;
  let errorCount = 0;
  const rollupMap = new Map<string, TemplateRollup>();

  for (const r of latest.results) {
    const vs = violationsByUrl.get(r.url) ?? [];
    const hasError = vs.some((v) => v.severity === "error");
    const hasWarning = vs.some((v) => v.severity === "warning");
    if (hasError) errorCount += 1;
    else if (hasWarning) warningOnlyCount += 1;
    else successCount += 1;

    const rollup = rollupMap.get(r.template) ?? {
      template: r.template,
      urlCount: 0,
      errorCount: 0,
      warningCount: 0,
    };
    rollup.urlCount += 1;
    rollup.errorCount += vs.filter((v) => v.severity === "error").length;
    rollup.warningCount += vs.filter((v) => v.severity === "warning").length;
    rollupMap.set(r.template, rollup);
  }

  const worstOffenders: OffenderRow[] = latest.results
    .map((r) => {
      const vs = violationsByUrl.get(r.url) ?? [];
      return {
        url: r.url,
        path: r.path,
        template: r.template,
        errorCount: vs.filter((v) => v.severity === "error").length,
        warningCount: vs.filter((v) => v.severity === "warning").length,
        violations: vs,
      };
    })
    .filter((o) => o.errorCount + o.warningCount > 0)
    .sort((a, b) => b.errorCount * 100 + b.warningCount - (a.errorCount * 100 + a.warningCount))
    .slice(0, 20);

  return {
    ok: true,
    generatedAt: latest.generated_at,
    mode: latest.mode,
    commitSha: latest.commit_sha,
    environment: latest.environment,
    totalUrls: latest.results.length,
    successCount,
    warningOnlyCount,
    errorCount,
    templateRollups: [...rollupMap.values()].sort((a, b) => b.errorCount - a.errorCount),
    worstOffenders,
    trend: readHistoryTrend(),
    results: latest.results,
    violations: latest.violations,
  };
}

export function pageQualitySummary(): PageQualitySummary {
  return cached("page-quality", TTL.daily, buildSummary);
}
