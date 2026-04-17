/**
 * Lighthouse パフォーマンス計測スクリプト
 *
 * Lighthouse CLI をローカル実行し、主要ページのパフォーマンスを計測して
 * .claude/skills/analytics/performance-improvement/snapshots/YYYY-MM-DD/metrics.csv に追記する。
 * 閾値は同ディレクトリの budgets.json を参照。
 * API キー不要・レート制限なし。
 *
 * 記録先の統一原則（CLAUDE.md §記録先の統一原則）:
 *   - 計測データは `.claude/skills/analytics/performance-improvement/` 配下のファイル
 *   - D1 の performance_metrics / performance_budgets は 2026-04-17 に廃止済み
 *   - PV 上位ページの抽出のみ D1 `ranking_page_views`（運用データ）を読む
 *
 * Usage:
 *   npx tsx scripts/lighthouse-check.ts                        # デフォルト URL をモバイルで計測
 *   npx tsx scripts/lighthouse-check.ts --strategy desktop     # デスクトップで計測
 *   npx tsx scripts/lighthouse-check.ts --url /                # 特定 URL のみ
 *   npx tsx scripts/lighthouse-check.ts --type theme           # 特定ページタイプのみ
 *   npx tsx scripts/lighthouse-check.ts --dry-run              # ファイル書込みなし
 *   npx tsx scripts/lighthouse-check.ts --top-pv 5             # PV 上位 N ページも計測対象に追加
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

// ── 定数 ──────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, "../../..");
const LOCAL_D1_PATH = path.join(
  REPO_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const PERF_DIR = path.join(
  REPO_ROOT,
  ".claude/skills/analytics/performance-improvement"
);
const BUDGETS_PATH = path.join(PERF_DIR, "budgets.json");
const SNAPSHOTS_DIR = path.join(PERF_DIR, "snapshots");

const BASE_URL = "https://stats47.jp";

interface SampleUrl {
  url: string;
  pageType: string;
}

const DEFAULT_SAMPLE_URLS: SampleUrl[] = [
  { url: "/", pageType: "homepage" },
  { url: "/themes/population-dynamics", pageType: "theme" },
  { url: "/themes/safety", pageType: "theme" },
  { url: "/themes/consumer-prices", pageType: "theme" },
  { url: "/areas/13000", pageType: "area" },
  { url: "/areas/01000", pageType: "area" },
  { url: "/areas/27000", pageType: "area" },
  { url: "/compare", pageType: "compare" },
  { url: "/correlation", pageType: "correlation" },
];

// ── 型定義 ──────────────────────────────────────────────

interface Args {
  url?: string;
  type?: string;
  strategy: "mobile" | "desktop";
  dryRun: boolean;
  topPv: number;
}

interface MetricsRow {
  url: string;
  pageType: string;
  strategy: string;
  date: string;
  scorePerformance: number | null;
  scoreAccessibility: number | null;
  scoreBestPractices: number | null;
  scoreSeo: number | null;
  lcpMs: number | null;
  fidMs: number | null;
  cls: number | null;
  inpMs: number | null;
  fcpMs: number | null;
  siMs: number | null;
  tbtMs: number | null;
  ttiMs: number | null;
  ttfbMs: number | null;
  totalByteWeight: number | null;
  jsByteWeight: number | null;
  cssByteWeight: number | null;
  imageByteWeight: number | null;
  fontByteWeight: number | null;
  thirdPartyByteWeight: number | null;
  domSize: number | null;
  requestCount: number | null;
  cruxLcpP75: number | null;
  cruxInpP75: number | null;
  cruxClsP75: number | null;
  cruxTtfbP75: number | null;
  cruxFcpP75: number | null;
  source: string;
}

interface BudgetRow {
  pageType: string;
  strategy: string;
  metricKey: string;
  threshold: number;
  operator: string;
  severity: string;
}

// ── 引数パース ──────────────────────────────────────────

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let url: string | undefined;
  let type: string | undefined;
  let strategy: "mobile" | "desktop" = "mobile";
  let dryRun = false;
  let topPv = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && args[i + 1]) { url = args[++i]; }
    else if (args[i] === "--type" && args[i + 1]) { type = args[++i]; }
    else if (args[i] === "--strategy" && args[i + 1]) { strategy = args[++i] as "mobile" | "desktop"; }
    else if (args[i] === "--dry-run") { dryRun = true; }
    else if (args[i] === "--top-pv" && args[i + 1]) { topPv = parseInt(args[++i], 10); }
  }

  return { url, type, strategy, dryRun, topPv };
}

// ── Lighthouse CLI 実行 ──────────────────────────────────

function runLighthouse(targetUrl: string, strategy: string): Record<string, unknown> | null {
  // Lighthouse CLI: モバイルがデフォルト、デスクトップは --preset=desktop
  const presetFlag = strategy === "desktop" ? "--preset=desktop" : "";

  const cmd = [
    "npx lighthouse",
    `"${targetUrl}"`,
    "--output=json",
    "--quiet",
    '--chrome-flags="--headless --no-sandbox"',
    presetFlag,
    "--only-categories=performance,accessibility,best-practices,seo",
  ].filter(Boolean).join(" ");

  try {
    const output = execSync(cmd, {
      encoding: "utf-8",
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`    Lighthouse CLI error: ${message.slice(0, 200)}`);
    return null;
  }
}

// ── Lighthouse JSON → MetricsRow パース ──────────────────

function parseLighthouseResult(
  json: Record<string, unknown>,
  urlPath: string,
  pageType: string,
  strategy: string,
  date: string
): MetricsRow {
  const categories = (json.categories || {}) as Record<string, { score?: number }>;
  const audits = (json.audits || {}) as Record<
    string,
    { numericValue?: number; details?: { items?: Array<Record<string, unknown>> } }
  >;

  // リソースサマリー
  const resourceItems = audits["resource-summary"]?.details?.items || [];
  const resourceMap = new Map<string, number>();
  for (const item of resourceItems) {
    const rt = item.resourceType as string | undefined;
    const ts = item.transferSize as number | undefined;
    if (rt && ts !== undefined) resourceMap.set(rt, ts);
  }

  let requestCount: number | null = null;
  for (const item of resourceItems) {
    if ((item.resourceType as string) === "total") {
      requestCount = (item.requestCount as number) ?? null;
      break;
    }
  }

  return {
    url: urlPath,
    pageType,
    strategy,
    date,
    scorePerformance: categories.performance?.score != null ? Math.round(categories.performance.score * 100) : null,
    scoreAccessibility: categories.accessibility?.score != null ? Math.round(categories.accessibility.score * 100) : null,
    scoreBestPractices: categories["best-practices"]?.score != null ? Math.round(categories["best-practices"].score * 100) : null,
    scoreSeo: categories.seo?.score != null ? Math.round(categories.seo.score * 100) : null,
    lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
    fidMs: audits["max-potential-fid"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    inpMs: null,
    fcpMs: audits["first-contentful-paint"]?.numericValue ?? null,
    siMs: audits["speed-index"]?.numericValue ?? null,
    tbtMs: audits["total-blocking-time"]?.numericValue ?? null,
    ttiMs: audits["interactive"]?.numericValue ?? null,
    ttfbMs: audits["server-response-time"]?.numericValue ?? null,
    totalByteWeight: audits["total-byte-weight"]?.numericValue ? Math.round(audits["total-byte-weight"].numericValue) : null,
    jsByteWeight: resourceMap.get("script") ?? null,
    cssByteWeight: resourceMap.get("stylesheet") ?? null,
    imageByteWeight: resourceMap.get("image") ?? null,
    fontByteWeight: resourceMap.get("font") ?? null,
    thirdPartyByteWeight: audits["third-party-summary"]?.numericValue ? Math.round(audits["third-party-summary"].numericValue) : null,
    domSize: audits["dom-size"]?.numericValue ? Math.round(audits["dom-size"].numericValue) : null,
    requestCount,
    cruxLcpP75: null,
    cruxInpP75: null,
    cruxClsP75: null,
    cruxTtfbP75: null,
    cruxFcpP75: null,
    source: "lighthouse",
  };
}

// ── CSV スナップショット I/O ─────────────────────────────

const CSV_COLUMNS = [
  "url", "page_type", "strategy", "date",
  "score_performance", "score_accessibility", "score_best_practices", "score_seo",
  "lcp_ms", "fid_ms", "cls", "inp_ms", "fcp_ms", "si_ms", "tbt_ms", "tti_ms", "ttfb_ms",
  "total_byte_weight", "js_byte_weight", "css_byte_weight", "image_byte_weight",
  "font_byte_weight", "third_party_byte_weight", "dom_size", "request_count",
  "crux_lcp_p75", "crux_inp_p75", "crux_cls_p75", "crux_ttfb_p75", "crux_fcp_p75",
  "source",
] as const;

function escapeCsv(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowToCsvValues(r: MetricsRow): Record<string, unknown> {
  return {
    url: r.url, page_type: r.pageType, strategy: r.strategy, date: r.date,
    score_performance: r.scorePerformance, score_accessibility: r.scoreAccessibility,
    score_best_practices: r.scoreBestPractices, score_seo: r.scoreSeo,
    lcp_ms: r.lcpMs, fid_ms: r.fidMs, cls: r.cls, inp_ms: r.inpMs, fcp_ms: r.fcpMs,
    si_ms: r.siMs, tbt_ms: r.tbtMs, tti_ms: r.ttiMs, ttfb_ms: r.ttfbMs,
    total_byte_weight: r.totalByteWeight, js_byte_weight: r.jsByteWeight,
    css_byte_weight: r.cssByteWeight, image_byte_weight: r.imageByteWeight,
    font_byte_weight: r.fontByteWeight, third_party_byte_weight: r.thirdPartyByteWeight,
    dom_size: r.domSize, request_count: r.requestCount,
    crux_lcp_p75: r.cruxLcpP75, crux_inp_p75: r.cruxInpP75, crux_cls_p75: r.cruxClsP75,
    crux_ttfb_p75: r.cruxTtfbP75, crux_fcp_p75: r.cruxFcpP75,
    source: r.source,
  };
}

function readSnapshotCsv(csvPath: string): Record<string, string>[] {
  if (!fs.existsSync(csvPath)) return [];
  const content = fs.readFileSync(csvPath, "utf-8").trim();
  if (!content) return [];
  const lines = content.split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).filter(l => l.length > 0).map(line => {
    // シンプルな CSV パーサ（本スクリプトの出力には引用符を含む値は基本出現しない）
    const fields = parseCsvLine(line);
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = fields[i] ?? ""; });
    return obj;
  });
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = ""; let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuote = false;
      else cur += c;
    } else {
      if (c === '"') inQuote = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

/**
 * snapshots/YYYY-MM-DD/metrics.csv に UPSERT する。
 * 既存行と url+strategy+source で衝突したら上書き。
 */
function upsertSnapshot(row: MetricsRow): void {
  const dir = path.join(SNAPSHOTS_DIR, row.date);
  const csvPath = path.join(dir, "metrics.csv");
  fs.mkdirSync(dir, { recursive: true });

  const existing = readSnapshotCsv(csvPath);
  const newValues = rowToCsvValues(row);
  const key = `${row.url}|${row.strategy}|${row.source}`;
  const filtered = existing.filter(
    r => `${r.url}|${r.strategy}|${r.source}` !== key,
  );
  filtered.push(newValues as unknown as Record<string, string>);

  // sort for deterministic output
  filtered.sort((a, b) => {
    const cmp = (a.url || "").localeCompare(b.url || "");
    return cmp !== 0 ? cmp : (a.strategy || "").localeCompare(b.strategy || "");
  });

  const lines = [CSV_COLUMNS.join(",")];
  for (const r of filtered) {
    lines.push(CSV_COLUMNS.map(c => escapeCsv((r as Record<string, unknown>)[c])).join(","));
  }
  fs.writeFileSync(csvPath, lines.join("\n") + "\n", "utf-8");
}

// ── Budgets（JSON から読み込み）──────────────────────────

interface BudgetsFile {
  version: number;
  description?: string;
  budgets: {
    page_type: string;
    strategy: string;
    metric_key: string;
    threshold: number;
    operator: string;
    severity: string;
  }[];
}

function loadBudgets(): BudgetRow[] {
  if (!fs.existsSync(BUDGETS_PATH)) {
    console.warn(`  ⚠ budgets.json が見つかりません: ${BUDGETS_PATH}`);
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(BUDGETS_PATH, "utf-8")) as BudgetsFile;
  return (raw.budgets || []).map(b => ({
    pageType: b.page_type,
    strategy: b.strategy,
    metricKey: b.metric_key,
    threshold: b.threshold,
    operator: b.operator,
    severity: b.severity,
  }));
}

// ── バジェットチェック ──────────────────────────────────────

interface BudgetViolation { url: string; metricKey: string; threshold: number; operator: string; actual: number; severity: string; }

function checkBudgets(budgets: BudgetRow[], row: MetricsRow): BudgetViolation[] {
  // 該当 page_type / strategy に絞る。page_type 個別が優先、なければ 'all'
  const applicable = budgets.filter(
    b => (b.pageType === row.pageType || b.pageType === "all") && b.strategy === row.strategy,
  );
  const budgetMap = new Map<string, BudgetRow>();
  for (const b of applicable) {
    const ex = budgetMap.get(b.metricKey);
    if (!ex || b.pageType !== "all") budgetMap.set(b.metricKey, b);
  }

  const metrics: Record<string, number | null> = {
    score_performance: row.scorePerformance, lcp_ms: row.lcpMs, cls: row.cls,
    tbt_ms: row.tbtMs, fcp_ms: row.fcpMs, ttfb_ms: row.ttfbMs,
  };

  const violations: BudgetViolation[] = [];
  for (const [key, budget] of budgetMap) {
    const actual = metrics[key];
    if (actual == null) continue;
    const violated = (budget.operator === "<=" && actual > budget.threshold) || (budget.operator === ">=" && actual < budget.threshold);
    if (violated) violations.push({ url: row.url, metricKey: key, threshold: budget.threshold, operator: budget.operator, actual, severity: budget.severity });
  }
  return violations;
}

// ── PV 上位ページ取得 ──────────────────────────────────────

function getTopPvPages(db: Database.Database, limit: number): SampleUrl[] {
  const hasTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ranking_page_views'").get();
  if (!hasTable) return [];
  const rows = db.prepare("SELECT ranking_key, SUM(page_views) as total_pv FROM ranking_page_views WHERE date >= date('now', '-7 days') GROUP BY ranking_key ORDER BY total_pv DESC LIMIT ?").all(limit) as { ranking_key: string }[];
  return rows.map(r => ({ url: `/ranking/${r.ranking_key}`, pageType: "ranking" }));
}

// ── ユーティリティ ──────────────────────────────────────────

function fmt(val: number | null, dec = 0): string { return val == null ? "-" : dec > 0 ? val.toFixed(dec) : Math.round(val).toString(); }
function fmtBytes(val: number | null): string { if (val == null) return "-"; if (val >= 1048576) return `${(val/1048576).toFixed(1)}MB`; if (val >= 1024) return `${(val/1024).toFixed(0)}KB`; return `${val}B`; }

function inferPageType(url: string): string {
  const p = url.replace(/^https?:\/\/[^/]+/, "");
  if (p === "/" || p === "") return "homepage";
  if (p.startsWith("/themes/")) return "theme";
  if (p.startsWith("/areas/")) return "area";
  if (p.startsWith("/ranking/")) return "ranking";
  if (p.startsWith("/compare")) return "compare";
  if (p.startsWith("/correlation")) return "correlation";
  if (p.startsWith("/blog/")) return "blog";
  return "other";
}

// ── メイン ────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const today = new Date().toISOString().slice(0, 10);

  console.log(`Lighthouse check: ${today} (${args.strategy})`);
  console.log(`  dry-run: ${args.dryRun}\n`);

  // 対象 URL
  let targets: SampleUrl[];
  if (args.url) {
    const fullUrl = args.url.startsWith("http") ? args.url : `${BASE_URL}${args.url}`;
    targets = [{ url: fullUrl, pageType: inferPageType(fullUrl) }];
  } else {
    targets = DEFAULT_SAMPLE_URLS.map(s => ({ url: `${BASE_URL}${s.url}`, pageType: s.pageType }));
    if (args.type) targets = targets.filter(t => t.pageType === args.type);
  }

  // 閾値をファイルから読む（.claude/skills/analytics/performance-improvement/budgets.json）
  const budgets = loadBudgets();
  if (budgets.length === 0) console.log("  (budgets.json 未配置 or 空 — 違反チェックをスキップ)");

  // PV 上位ページは D1 `ranking_page_views`（運用データ）から取得
  let db: Database.Database | null = null;
  if (args.topPv > 0 && fs.existsSync(LOCAL_D1_PATH)) {
    db = new Database(LOCAL_D1_PATH, { readonly: true });
    const topPages = getTopPvPages(db, args.topPv);
    const existing = new Set(targets.map(t => t.url));
    for (const p of topPages) { const u = `${BASE_URL}${p.url}`; if (!existing.has(u)) { targets.push({ url: u, pageType: p.pageType }); existing.add(u); } }
    db.close();
    db = null;
  }

  console.log(`  Targets (${targets.length}):`);
  for (const t of targets) console.log(`    ${t.pageType.padEnd(12)} ${t.url}`);
  console.log("");

  const results: MetricsRow[] = [];
  const allViolations: BudgetViolation[] = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const shortUrl = target.url.replace(BASE_URL, "") || "/";
    console.log(`  [${i + 1}/${targets.length}] ${shortUrl} (${args.strategy})...`);

    const json = runLighthouse(target.url, args.strategy);
    if (!json) continue;

    const row = parseLighthouseResult(json, shortUrl, target.pageType, args.strategy, today);
    results.push(row);

    console.log(`    Perf=${row.scorePerformance} A11y=${row.scoreAccessibility} LCP=${fmt(row.lcpMs)}ms CLS=${fmt(row.cls, 3)} TBT=${fmt(row.tbtMs)}ms`);

    if (!args.dryRun) { upsertSnapshot(row); console.log("    → snapshot 保存"); }

    if (budgets.length > 0) {
      const v = checkBudgets(budgets, row);
      allViolations.push(...v);
      for (const vi of v) console.log(`    ${vi.severity === "error" ? "!!" : "!"} ${vi.metricKey}: ${vi.actual} (budget: ${vi.operator}${vi.threshold})`);
    }
  }

  // Markdown 出力
  if (results.length > 0) {
    console.log("\n## Lighthouse Scores\n");
    console.log("| URL | Perf | A11y | BP | SEO | LCP | CLS | TBT | FCP | TTFB |");
    console.log("|-----|------|------|----|-----|-----|-----|-----|-----|------|");
    for (const r of results) console.log(`| ${r.url} | ${fmt(r.scorePerformance)} | ${fmt(r.scoreAccessibility)} | ${fmt(r.scoreBestPractices)} | ${fmt(r.scoreSeo)} | ${fmt(r.lcpMs)}ms | ${fmt(r.cls, 3)} | ${fmt(r.tbtMs)}ms | ${fmt(r.fcpMs)}ms | ${fmt(r.ttfbMs)}ms |`);

    console.log("\n## Resources\n");
    console.log("| URL | Total | JS | CSS | Image | Font | DOM | Reqs |");
    console.log("|-----|-------|-----|-----|-------|------|-----|------|");
    for (const r of results) console.log(`| ${r.url} | ${fmtBytes(r.totalByteWeight)} | ${fmtBytes(r.jsByteWeight)} | ${fmtBytes(r.cssByteWeight)} | ${fmtBytes(r.imageByteWeight)} | ${fmtBytes(r.fontByteWeight)} | ${fmt(r.domSize)} | ${fmt(r.requestCount)} |`);

    if (allViolations.length > 0) {
      console.log("\n## Budget Violations\n");
      console.log("| Severity | URL | Metric | Budget | Actual |");
      console.log("|----------|-----|--------|--------|--------|");
      for (const v of allViolations) console.log(`| ${v.severity === "error" ? "ERROR" : "WARN"} | ${v.url} | ${v.metricKey} | ${v.operator}${v.threshold} | ${v.actual} |`);
    } else {
      console.log("\n✅ All metrics within budget.");
    }
  }

  console.log(`\nDone: ${results.length}/${targets.length} pages measured.`);
  if (allViolations.length > 0) {
    const e = allViolations.filter(v => v.severity === "error").length;
    const w = allViolations.filter(v => v.severity === "warning").length;
    console.log(`Budget violations: ${e} error(s), ${w} warning(s)`);
  }

}

main().catch(err => { console.error("Error:", err); process.exit(1); });
