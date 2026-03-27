/**
 * Lighthouse パフォーマンス計測スクリプト
 *
 * Lighthouse CLI をローカル実行し、主要ページのパフォーマンスを計測して
 * performance_metrics テーブルに UPSERT する。
 * API キー不要・レート制限なし。
 *
 * Usage:
 *   npx tsx scripts/lighthouse-check.ts                        # デフォルト URL をモバイルで計測
 *   npx tsx scripts/lighthouse-check.ts --strategy desktop     # デスクトップで計測
 *   npx tsx scripts/lighthouse-check.ts --url /                # 特定 URL のみ
 *   npx tsx scripts/lighthouse-check.ts --type theme           # 特定ページタイプのみ
 *   npx tsx scripts/lighthouse-check.ts --dry-run              # DB 書込みなし
 *   npx tsx scripts/lighthouse-check.ts --top-pv 5             # PV 上位 N ページも計測対象に追加
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

// ── 定数 ──────────────────────────────────────────────

const LOCAL_D1_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

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

// ── DB テーブル作成 ──────────────────────────────────────

function ensureTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL, page_type TEXT NOT NULL, strategy TEXT NOT NULL, date TEXT NOT NULL,
      score_performance INTEGER, score_accessibility INTEGER, score_best_practices INTEGER, score_seo INTEGER,
      lcp_ms REAL, fid_ms REAL, cls REAL, inp_ms REAL,
      fcp_ms REAL, si_ms REAL, tbt_ms REAL, tti_ms REAL, ttfb_ms REAL,
      total_byte_weight INTEGER, js_byte_weight INTEGER, css_byte_weight INTEGER, image_byte_weight INTEGER,
      font_byte_weight INTEGER, third_party_byte_weight INTEGER,
      dom_size INTEGER, request_count INTEGER,
      crux_lcp_p75 REAL, crux_inp_p75 REAL, crux_cls_p75 REAL, crux_ttfb_p75 REAL, crux_fcp_p75 REAL,
      source TEXT DEFAULT 'lighthouse',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS performance_metrics_url_strategy_date_source_unq ON performance_metrics(url, strategy, date, source);
    CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(date);
    CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_type ON performance_metrics(page_type);
    CREATE TABLE IF NOT EXISTS performance_budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_type TEXT NOT NULL, strategy TEXT NOT NULL, metric_key TEXT NOT NULL,
      threshold REAL NOT NULL, operator TEXT NOT NULL DEFAULT '<=', severity TEXT NOT NULL DEFAULT 'warning',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS performance_budgets_type_strategy_metric_unq ON performance_budgets(page_type, strategy, metric_key);
  `);
}

// ── UPSERT ──────────────────────────────────────────────

function upsertMetrics(db: Database.Database, row: MetricsRow): void {
  db.prepare(`
    INSERT INTO performance_metrics (
      url, page_type, strategy, date,
      score_performance, score_accessibility, score_best_practices, score_seo,
      lcp_ms, fid_ms, cls, inp_ms, fcp_ms, si_ms, tbt_ms, tti_ms, ttfb_ms,
      total_byte_weight, js_byte_weight, css_byte_weight, image_byte_weight,
      font_byte_weight, third_party_byte_weight, dom_size, request_count,
      crux_lcp_p75, crux_inp_p75, crux_cls_p75, crux_ttfb_p75, crux_fcp_p75,
      source, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
    ON CONFLICT (url, strategy, date, source) DO UPDATE SET
      score_performance=excluded.score_performance, score_accessibility=excluded.score_accessibility,
      score_best_practices=excluded.score_best_practices, score_seo=excluded.score_seo,
      lcp_ms=excluded.lcp_ms, fid_ms=excluded.fid_ms, cls=excluded.cls, inp_ms=excluded.inp_ms,
      fcp_ms=excluded.fcp_ms, si_ms=excluded.si_ms, tbt_ms=excluded.tbt_ms, tti_ms=excluded.tti_ms, ttfb_ms=excluded.ttfb_ms,
      total_byte_weight=excluded.total_byte_weight, js_byte_weight=excluded.js_byte_weight,
      css_byte_weight=excluded.css_byte_weight, image_byte_weight=excluded.image_byte_weight,
      font_byte_weight=excluded.font_byte_weight, third_party_byte_weight=excluded.third_party_byte_weight,
      dom_size=excluded.dom_size, request_count=excluded.request_count, updated_at=datetime('now')
  `).run(
    row.url, row.pageType, row.strategy, row.date,
    row.scorePerformance, row.scoreAccessibility, row.scoreBestPractices, row.scoreSeo,
    row.lcpMs, row.fidMs, row.cls, row.inpMs, row.fcpMs, row.siMs, row.tbtMs, row.ttiMs, row.ttfbMs,
    row.totalByteWeight, row.jsByteWeight, row.cssByteWeight, row.imageByteWeight,
    row.fontByteWeight, row.thirdPartyByteWeight, row.domSize, row.requestCount,
    row.cruxLcpP75, row.cruxInpP75, row.cruxClsP75, row.cruxTtfbP75, row.cruxFcpP75,
    row.source
  );
}

// ── デフォルトバジェットシード ──────────────────────────────

const DEFAULT_BUDGETS: BudgetRow[] = [
  { pageType: "all", strategy: "mobile", metricKey: "score_performance", threshold: 80, operator: ">=", severity: "error" },
  { pageType: "all", strategy: "mobile", metricKey: "lcp_ms", threshold: 2500, operator: "<=", severity: "error" },
  { pageType: "all", strategy: "mobile", metricKey: "cls", threshold: 0.1, operator: "<=", severity: "error" },
  { pageType: "all", strategy: "mobile", metricKey: "tbt_ms", threshold: 300, operator: "<=", severity: "warning" },
  { pageType: "all", strategy: "mobile", metricKey: "fcp_ms", threshold: 1800, operator: "<=", severity: "warning" },
  { pageType: "all", strategy: "mobile", metricKey: "ttfb_ms", threshold: 800, operator: "<=", severity: "warning" },
  { pageType: "all", strategy: "desktop", metricKey: "score_performance", threshold: 90, operator: ">=", severity: "error" },
  { pageType: "all", strategy: "desktop", metricKey: "lcp_ms", threshold: 2000, operator: "<=", severity: "error" },
  { pageType: "all", strategy: "desktop", metricKey: "cls", threshold: 0.1, operator: "<=", severity: "error" },
  { pageType: "all", strategy: "desktop", metricKey: "tbt_ms", threshold: 200, operator: "<=", severity: "warning" },
  { pageType: "homepage", strategy: "mobile", metricKey: "score_performance", threshold: 90, operator: ">=", severity: "error" },
  { pageType: "homepage", strategy: "mobile", metricKey: "lcp_ms", threshold: 2000, operator: "<=", severity: "error" },
];

function seedDefaultBudgets(db: Database.Database): void {
  const { cnt } = db.prepare("SELECT COUNT(*) as cnt FROM performance_budgets").get() as { cnt: number };
  if (cnt > 0) return;
  console.log("  Seeding default performance budgets...");
  const stmt = db.prepare("INSERT OR IGNORE INTO performance_budgets (page_type, strategy, metric_key, threshold, operator, severity) VALUES (?,?,?,?,?,?)");
  db.transaction(() => { for (const b of DEFAULT_BUDGETS) stmt.run(b.pageType, b.strategy, b.metricKey, b.threshold, b.operator, b.severity); })();
  console.log(`  ${DEFAULT_BUDGETS.length} budgets seeded.`);
}

// ── バジェットチェック ──────────────────────────────────────

interface BudgetViolation { url: string; metricKey: string; threshold: number; operator: string; actual: number; severity: string; }

function checkBudgets(db: Database.Database, row: MetricsRow): BudgetViolation[] {
  const budgets = db.prepare("SELECT * FROM performance_budgets WHERE (page_type = ? OR page_type = 'all') AND strategy = ?").all(row.pageType, row.strategy) as BudgetRow[];
  const budgetMap = new Map<string, BudgetRow>();
  for (const b of budgets) { const ex = budgetMap.get(b.metricKey); if (!ex || b.pageType !== "all") budgetMap.set(b.metricKey, b); }

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

  // DB
  let db: Database.Database | null = null;
  if (fs.existsSync(LOCAL_D1_PATH)) {
    db = new Database(LOCAL_D1_PATH);
    ensureTables(db);
    seedDefaultBudgets(db);
  }

  if (args.topPv > 0 && db) {
    const topPages = getTopPvPages(db, args.topPv);
    const existing = new Set(targets.map(t => t.url));
    for (const p of topPages) { const u = `${BASE_URL}${p.url}`; if (!existing.has(u)) { targets.push({ url: u, pageType: p.pageType }); existing.add(u); } }
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

    if (!args.dryRun && db) { upsertMetrics(db, row); console.log("    → DB saved"); }

    if (db) {
      const v = checkBudgets(db, row);
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

  if (db) db.close();
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
