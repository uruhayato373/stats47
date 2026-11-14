/**
 * gsc-demand — 「何にアクセスが集まっているか」を GSC の週次 snapshot からカテゴリ別・長期で集計する。
 *
 * 出力 (update-history-csv.mjs の GSC 更新が毎週呼ぶ。snapshot は削除しないので全週から決定的に作り直す):
 *   - data/gsc/demand-history.csv  … 重ならない 28 日窓ごとのセクション別・カテゴリ別・テーマ別の集計 (長期の推移)
 *   - data/gsc/demand-weekly.csv   … 確定 7 日の明細 (queries/pages-finalized7d.csv) がある週の同じ集計 (前週比用)
 *   - data/gsc/DEMAND-LATEST.md    … 長期・直近 28 日・前週比のカテゴリ順位と上位テーマ・ページ・検索語、捕捉率と期間
 *
 * 契約 (GSC-DEMAND-REPORT-01):
 *   - 期間は snapshot の daily.csv の最初と最後の日付 (実際に取れた日) で表す。週 ID を期間の代わりにしない。
 *   - 長期の窓は古い週から順に、前の窓の最終日より後に始まる snapshot だけを選ぶ (重なる 28 日窓を足し合わせない)。
 *     新しい週が増えても既存の窓は変わらない (古い側から選ぶため)。窓の間に集計されない日が残ることがある。
 *   - キーワード表の捕捉率 = queries の clicks 合計 ÷ サイト全体の clicks。伏せられた検索語を推定で埋めない。
 *   - 前週比は確定 7 日どうし (期間が連続するもの) だけ。28 日窓の週次差分を前週比と呼ばない。
 *   - ページ → カテゴリ: ランキング (都道府県・市区町村) は指標の category、旧 URL (/<カテゴリ>/…/ranking/<key>) は
 *     指標が無ければ先頭のカテゴリ、ブログは台帳 rankingKeys の指標のカテゴリの多数決、/category/<key> はその key。
 *     それ以外 (地域・テーマ・一覧など) は "none" (カテゴリなし) とし、推定で割り当てない。
 *
 * テスト: __tests__/gsc-demand.test.mjs
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import { parseCsv } from "./measurement-cycle.mjs";
import { classifyPageType } from "./page-type.mjs";
import { addDays, isoWeekOf, isoWeekRange } from "./periods.mjs";
import { toCsv } from "./auth.mjs";
import { SITE_ORIGIN } from "../../lib/site-config.cjs";

export const DEMAND_HISTORY_FILE = "demand-history.csv";
export const DEMAND_WEEKLY_FILE = "demand-weekly.csv";
export const DEMAND_LATEST_FILE = "DEMAND-LATEST.md";
export const QUERIES_FINALIZED_FILE = "queries-finalized7d.csv";
export const PAGES_FINALIZED_FILE = "pages-finalized7d.csv";

export const DEMAND_FIELDS = Object.freeze([
  "window_week",
  "basis",
  "period_start",
  "period_end",
  "days_present",
  "dimension",
  "key",
  "label",
  "clicks",
  "impressions",
  "ctr",
  "position",
  "pages",
  "click_share",
  "site_clicks",
  "query_clicks",
  "page_clicks",
  "query_capture_rate",
  "page_capture_rate",
]);

export const BASIS_ROLLING = "rolling28d-nonoverlap";
export const BASIS_FINALIZED = "finalized7d";
export const NO_CATEGORY = "none";

const TOP_PAGES = 15;
const TOP_QUERIES = 15;
const TOP_THEMES = 10;
/** 「表示が多いのにクリックが少ない語」の下限表示回数と上限 CTR (直近 28 日)。 */
const LOW_CTR_MIN_IMPRESSIONS = 200;
const LOW_CTR_MAX = 0.01;
const LOW_CTR_TOP = 15;

/** URL の先頭の階層 → セクション。テーマのページは先にテーマとして数える (地域の配下に 9 割がある)。 */
const SECTION_LABELS = Object.freeze({
  home: "トップ",
  ranking: "ランキング (都道府県)",
  municipalities: "市区町村",
  blog: "ブログ",
  themes: "テーマ",
  areas: "地域 (県・市区町村の一覧)",
  japan: "全国",
  geo: "地域分析",
  survey: "調査",
  category: "カテゴリ",
  tag: "タグ",
  products: "商品",
  api: "API",
  other: "その他",
});

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const ratio = (part, whole) => (whole > 0 ? Number((part / whole).toFixed(4)) : null);
const pct = (v) => (v === null || v === undefined || v === "" ? "-" : `${(Number(v) * 100).toFixed(1)}%`);
const int = (v) => Math.round(num(v)).toLocaleString("en-US");

// ── 文脈 (ページ → カテゴリの写像) ─────────────────────────────

/** data/metrics/*.ts の最上位の key と category を読む (TS を実行しない。両方 1 つずつある定義だけを採る)。 */
export function loadMetricCategories(root) {
  const dir = join(root, datasetDir("metrics.definitions"));
  const out = new Map();
  for (const f of readdirSync(dir).filter((name) => name.endsWith(".ts"))) {
    const text = readFileSync(join(dir, f), "utf8");
    const keys = [...text.matchAll(/^ {2}["']?key["']?\s*:\s*["']([^"']+)["']/gm)].map((m) => m[1]);
    const cats = [...text.matchAll(/^ {2}["']?category["']?\s*:\s*["']([^"']+)["']/gm)].map((m) => m[1]);
    if (keys.length === 1 && cats.length === 1) out.set(keys[0], cats[0]);
  }
  return out;
}

/** ブログの slug → カテゴリ。台帳の rankingKeys の指標のカテゴリの多数決 (同数なら rankingKeys で先に出たもの)。 */
export function blogCategoriesFromLedger(articles, metricCategory) {
  const out = new Map();
  for (const a of articles ?? []) {
    const counts = new Map();
    for (const key of a.rankingKeys ?? []) {
      const cat = metricCategory.get(key);
      if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    let best = null;
    for (const [cat, n] of counts) if (best === null || n > counts.get(best)) best = cat;
    if (best) out.set(a.slug, best);
  }
  return out;
}

/** 実ファイルから文脈を作る。 */
export function loadDemandContext(root) {
  const metricCategory = loadMetricCategories(root);
  const articles = JSON.parse(readFileSync(join(root, datasetPath("blog.articles")), "utf8")).articles;
  const categories = JSON.parse(readFileSync(join(root, datasetPath("categories.master")), "utf8")).categories;
  const themeDir = join(root, datasetDir("themes.catalogs"));
  const themeTitles = new Map();
  for (const f of readdirSync(themeDir).filter((name) => name.endsWith(".json"))) {
    const t = JSON.parse(readFileSync(join(themeDir, f), "utf8"));
    themeTitles.set(t.key ?? f.slice(0, -".json".length), t.title ?? t.key);
  }
  return createDemandContext({
    metricCategory,
    blogCategory: blogCategoriesFromLedger(articles, metricCategory),
    categoryNames: new Map(categories.map((c) => [c.key, c.name])),
    themeTitles,
  });
}

/** 文脈を組み立てる (テストは写像を直接渡す)。isThemePath の既定は page-type.mjs のテーマ判定。 */
export function createDemandContext({
  metricCategory = new Map(),
  blogCategory = new Map(),
  categoryNames = new Map(),
  themeTitles = new Map(),
  isThemePath = (path) => classifyPageType(path) === "theme-detail",
} = {}) {
  return { metricCategory, blogCategory, categoryNames, themeTitles, isThemePath };
}

function pathOf(page) {
  let path;
  try {
    path = new URL(String(page), SITE_ORIGIN).pathname;
  } catch {
    path = String(page).split("?")[0].split("#")[0];
  }
  try {
    path = decodeURIComponent(path);
  } catch {
    /* 復号できない URL はそのまま */
  }
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * GSC の page (URL) → { path, section, category, theme }。決定的で、写像に無いものは推定しない。
 * @param {string} page
 * @param {ReturnType<typeof createDemandContext>} ctx
 */
export function classifyGscPage(page, ctx) {
  const path = pathOf(page);
  const segs = path.split("/").filter(Boolean);
  const first = segs[0] ?? "";
  const metricCat = (key) => (key ? (ctx.metricCategory.get(key) ?? null) : null);

  if (segs.length === 0) return { path: "/", section: "home", category: NO_CATEGORY, theme: null };

  if (ctx.isThemePath(path)) {
    const slug = [...segs].reverse().find((s) => ctx.themeTitles.has(s)) ?? segs[segs.length - 1];
    return { path, section: "themes", category: NO_CATEGORY, theme: slug };
  }
  if (first === "ranking") {
    return { path, section: "ranking", category: metricCat(segs[1]) ?? NO_CATEGORY, theme: null };
  }
  if (first === "municipalities") {
    const key = segs[1] === "ranking" ? segs[2] : null;
    return { path, section: "municipalities", category: metricCat(key) ?? NO_CATEGORY, theme: null };
  }
  if (first === "blog") {
    const cat = segs[1] ? ctx.blogCategory.get(segs[1]) : null;
    return { path, section: "blog", category: cat ?? NO_CATEGORY, theme: null };
  }
  if (first === "category") {
    const cat = segs[1] && ctx.categoryNames.has(segs[1]) ? segs[1] : NO_CATEGORY;
    return { path, section: "category", category: cat, theme: null };
  }
  if (ctx.categoryNames.has(first)) {
    // 旧 URL: /<カテゴリ>/<サブカテゴリ>/ranking/<key> と /<カテゴリ>/… の一覧
    const rankingAt = segs.indexOf("ranking");
    if (rankingAt >= 0) {
      return { path, section: "ranking", category: metricCat(segs[rankingAt + 1]) ?? first, theme: null };
    }
    return { path, section: "category", category: first, theme: null };
  }
  const section = Object.hasOwn(SECTION_LABELS, first) ? first : "other";
  return { path, section, category: NO_CATEGORY, theme: null };
}

// ── 集計 ───────────────────────────────────────────────────

function emptyCell() {
  return { clicks: 0, impressions: 0, posWeighted: 0, pages: 0 };
}

/** pages.csv の行 → セクション・カテゴリ・テーマごとの合計と、ページ単位の分類結果。 */
export function aggregateDemand(pageRows, ctx) {
  const dims = { section: new Map(), category: new Map(), theme: new Map() };
  const pages = [];
  let pageClicks = 0;
  for (const r of pageRows ?? []) {
    const c = classifyGscPage(r.page, ctx);
    const clicks = num(r.clicks);
    const impressions = num(r.impressions);
    pageClicks += clicks;
    pages.push({ ...c, clicks, impressions, position: num(r.position) });
    const add = (dim, key) => {
      if (key === null || key === undefined) return;
      const cell = dims[dim].get(key) ?? emptyCell();
      cell.clicks += clicks;
      cell.impressions += impressions;
      cell.posWeighted += num(r.position) * impressions;
      cell.pages += 1;
      dims[dim].set(key, cell);
    };
    add("section", c.section);
    add("category", c.category);
    add("theme", c.theme);
  }
  return { dims, pages, pageClicks };
}

/** 明細の捕捉率 (queries・pages の clicks 合計 ÷ サイト全体の clicks)。 */
export function detailCoverage({ periodStart, periodEnd, queryRows, pageRows, siteClicks }) {
  const sum = (rows) => (rows ?? []).reduce((s, r) => s + num(r.clicks), 0);
  const queryClicks = sum(queryRows);
  const pageClicks = sum(pageRows);
  return {
    periodStart,
    periodEnd,
    siteClicks,
    queryClicks,
    pageClicks,
    queryRows: (queryRows ?? []).length,
    pageRows: (pageRows ?? []).length,
    queryCaptureRate: ratio(queryClicks, siteClicks),
    pageCaptureRate: ratio(pageClicks, siteClicks),
  };
}

export function labelFor(dimension, key, ctx) {
  if (dimension === "total") return "サイト全体";
  if (dimension === "section") return SECTION_LABELS[key] ?? key;
  if (dimension === "category") return key === NO_CATEGORY ? "カテゴリなし (地域・テーマ・一覧など)" : (ctx.categoryNames.get(key) ?? key);
  if (dimension === "theme") return ctx.themeTitles.get(key) ?? key;
  return key;
}

/** 1 つの窓の CSV 行 (サイト全体 1 行 + セクション・カテゴリ・テーマ)。各次元はクリックの多い順。 */
export function buildDemandRows({ week, basis, periodStart, periodEnd, daysPresent, siteClicks, siteImpressions, coverage, aggregate, ctx }) {
  const base = {
    window_week: week,
    basis,
    period_start: periodStart,
    period_end: periodEnd,
    days_present: daysPresent,
    site_clicks: siteClicks,
    query_clicks: coverage.queryClicks,
    page_clicks: coverage.pageClicks,
    query_capture_rate: coverage.queryCaptureRate ?? "",
    page_capture_rate: coverage.pageCaptureRate ?? "",
  };
  /** @type {Record<string, string | number>[]} */
  const rows = [
    {
      ...base,
      dimension: "total",
      key: "site",
      label: labelFor("total", "site", ctx),
      clicks: siteClicks,
      impressions: siteImpressions,
      ctr: siteImpressions > 0 ? (siteClicks / siteImpressions).toFixed(4) : "",
      position: "",
      pages: coverage.pageRows,
      click_share: "",
    },
  ];
  for (const dimension of ["section", "category", "theme"]) {
    const entries = [...aggregate.dims[dimension].entries()].sort((a, b) => b[1].clicks - a[1].clicks || (a[0] < b[0] ? -1 : 1));
    for (const [key, cell] of entries) {
      rows.push({
        ...base,
        dimension,
        key,
        label: labelFor(dimension, key, ctx),
        clicks: cell.clicks,
        impressions: cell.impressions,
        ctr: cell.impressions > 0 ? (cell.clicks / cell.impressions).toFixed(4) : "",
        position: cell.impressions > 0 ? (cell.posWeighted / cell.impressions).toFixed(2) : "",
        pages: cell.pages,
        click_share: ratio(cell.clicks, aggregate.pageClicks) ?? "",
      });
    }
  }
  return rows;
}

/**
 * 重ならない窓を古い順に選ぶ。前の窓の最終日より後に始まる週だけを採る。
 * @param {{week:string, periodStart:string, periodEnd:string}[]} infos 週の昇順
 */
export function selectNonOverlappingWindows(infos) {
  const out = [];
  let lastEnd = null;
  for (const info of infos) {
    if (!info.periodStart || !info.periodEnd) continue;
    if (lastEnd !== null && info.periodStart <= lastEnd) continue;
    out.push(info);
    lastEnd = info.periodEnd;
  }
  return out;
}

export function previousIsoWeek(week) {
  return isoWeekOf(addDays(isoWeekRange(week).monday, -7));
}

// ── snapshot の読み込み ─────────────────────────────────────

function readRows(path) {
  return existsSync(path) ? parseCsv(readFileSync(path, "utf8")) : null;
}

/** 1 週の snapshot を読む。daily.csv と pages.csv が無ければ null。 */
export function readWeekSnapshot(snapDir, week) {
  const daily = readRows(join(snapDir, "daily.csv"));
  const pages = readRows(join(snapDir, "pages.csv"));
  if (!daily || daily.length === 0 || !pages) return null;
  const dates = daily.map((r) => r.date).filter(Boolean).sort();
  const summaryPath = join(snapDir, "summary.json");
  let summary = null;
  if (existsSync(summaryPath)) {
    try {
      summary = JSON.parse(readFileSync(summaryPath, "utf8"));
    } catch {
      summary = null;
    }
  }
  return {
    week,
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    daysPresent: dates.length,
    siteClicks: daily.reduce((s, r) => s + num(r.clicks), 0),
    siteImpressions: daily.reduce((s, r) => s + num(r.impressions), 0),
    queries: readRows(join(snapDir, "queries.csv")) ?? [],
    pages,
    queries7d: readRows(join(snapDir, QUERIES_FINALIZED_FILE)),
    pages7d: readRows(join(snapDir, PAGES_FINALIZED_FILE)),
    summary,
  };
}

/** 週の snapshot から、28 日の明細と確定 7 日の明細 (あれば) の期間と捕捉率を作る。summary.json の details と同じ形。 */
export function snapshotDetailCoverage(snap) {
  if (!snap) return null;
  const fin = snap.summary?.finalized7d ?? null;
  return {
    rolling28d: detailCoverage({
      periodStart: snap.periodStart,
      periodEnd: snap.periodEnd,
      queryRows: snap.queries,
      pageRows: snap.pages,
      siteClicks: snap.siteClicks,
    }),
    finalized7d:
      snap.pages7d && fin
        ? detailCoverage({
            periodStart: fin.periodStart,
            periodEnd: fin.periodEnd,
            queryRows: snap.queries7d ?? [],
            pageRows: snap.pages7d,
            siteClicks: num(fin.kpis?.clicks),
          })
        : null,
  };
}

function finalizedRows(snap, ctx) {
  const fin = snap.summary?.finalized7d;
  if (!snap.pages7d || !fin || fin.coverage?.status !== "complete") return null;
  const cov = snapshotDetailCoverage(snap).finalized7d;
  return buildDemandRows({
    week: snap.week,
    basis: BASIS_FINALIZED,
    periodStart: fin.periodStart,
    periodEnd: fin.periodEnd,
    daysPresent: fin.coverage?.presentCount ?? 7,
    siteClicks: num(fin.kpis?.clicks),
    siteImpressions: num(fin.kpis?.impressions),
    coverage: cov,
    aggregate: aggregateDemand(snap.pages7d, ctx),
    ctx,
  });
}

function rollingRows(snap, ctx) {
  return buildDemandRows({
    week: snap.week,
    basis: BASIS_ROLLING,
    periodStart: snap.periodStart,
    periodEnd: snap.periodEnd,
    daysPresent: snap.daysPresent,
    siteClicks: snap.siteClicks,
    siteImpressions: snap.siteImpressions,
    coverage: snapshotDetailCoverage(snap).rolling28d,
    aggregate: aggregateDemand(snap.pages, ctx),
    ctx,
  });
}

// ── DEMAND-LATEST.md ────────────────────────────────────────

function rankTable(rows, { limit = Infinity } = {}) {
  const lines = ["| 順位 | 名前 | クリック | 割合 | 表示 | CTR |", "|---|---|---|---|---|---|"];
  rows.slice(0, limit).forEach((r, i) => {
    lines.push(`| ${i + 1} | ${r.label} | ${int(r.clicks)} | ${pct(r.click_share)} | ${int(r.impressions)} | ${pct(r.ctr)} |`);
  });
  return lines;
}

function coverageLine(r) {
  return (
    `期間 ${r.period_start} 〜 ${r.period_end} (${r.days_present} 日分)・サイト全体のクリック ${int(r.site_clicks)}・` +
    `キーワード表の捕捉率 ${pct(r.query_capture_rate)} (${int(r.query_clicks)} / ${int(r.site_clicks)})・` +
    `ページ表の捕捉率 ${pct(r.page_capture_rate)}`
  );
}

/** 長期 (重ならない 28 日窓の合計) のカテゴリ順位と、窓ごとの推移の表。 */
function longTermSection(historyRows) {
  const lines = ["## 1. 長期 (重ならない 28 日窓の合計)", ""];
  const windows = [...new Set(historyRows.map((r) => r.window_week))].sort();
  if (windows.length === 0) {
    lines.push("_集計できる snapshot がない_", "");
    return lines;
  }
  const totals = historyRows.filter((r) => r.dimension === "total");
  const days = totals.reduce((s, r) => s + num(r.days_present), 0);
  lines.push(
    `窓 ${windows.length} 個 (${totals[0].period_start} 〜 ${totals[totals.length - 1].period_end} のうち ${days} 日分)。` +
      "窓の間に集計されない日がある。各窓の期間は `demand-history.csv` の period_start / period_end にある。",
    "",
  );
  const sumBy = (dimension) => {
    const m = new Map();
    for (const r of historyRows.filter((x) => x.dimension === dimension)) {
      const cur = m.get(r.key) ?? { label: r.label, clicks: 0, impressions: 0 };
      cur.clicks += num(r.clicks);
      cur.impressions += num(r.impressions);
      m.set(r.key, cur);
    }
    const all = [...m.values()].reduce((s, v) => s + v.clicks, 0);
    return [...m.entries()]
      .map(([key, v]) => ({ key, ...v, click_share: ratio(v.clicks, all), ctr: v.impressions > 0 ? v.clicks / v.impressions : null }))
      .sort((a, b) => b.clicks - a.clicks);
  };
  lines.push("### カテゴリ順位 (長期)", "", ...rankTable(sumBy("category")), "");
  lines.push("### セクション順位 (長期)", "", ...rankTable(sumBy("section")), "");

  // 窓ごとのカテゴリのクリック割合 (推移)
  const cats = sumBy("category");
  lines.push("### カテゴリのクリック割合の推移 (窓ごと)", "");
  lines.push(`| カテゴリ | ${windows.map((w) => w.replace(/^\d{4}-/, "")).join(" | ")} |`);
  lines.push(`|---|${windows.map(() => "---").join("|")}|`);
  for (const c of cats) {
    const cells = windows.map((w) => {
      const r = historyRows.find((x) => x.window_week === w && x.dimension === "category" && x.key === c.key);
      return r ? pct(r.click_share) : "-";
    });
    lines.push(`| ${c.label} | ${cells.join(" | ")} |`);
  }
  lines.push(`| (サイト全体のクリック) | ${windows.map((w) => int(totals.find((t) => t.window_week === w)?.clicks)).join(" | ")} |`);
  lines.push("");
  return lines;
}

function latestSection(latestRows, snap, ctx) {
  const total = latestRows.find((r) => r.dimension === "total");
  const by = (dimension) => latestRows.filter((r) => r.dimension === dimension);
  const lines = [`## 2. 直近 28 日 (${snap.week} の snapshot)`, "", coverageLine(total), ""];
  lines.push("> この 28 日窓は前後の週の snapshot と 21 日重なる。週どうしの差を前週比と呼ばない。", "");
  lines.push("### カテゴリ順位", "", ...rankTable(by("category")), "");
  lines.push("### セクション順位", "", ...rankTable(by("section")), "");
  lines.push(`### 上位テーマ (${TOP_THEMES} 件)`, "", ...rankTable(by("theme"), { limit: TOP_THEMES }), "");

  const pages = aggregateDemand(snap.pages, ctx)
    .pages.slice()
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, TOP_PAGES);
  lines.push(`### 上位ページ (${TOP_PAGES} 件)`, "", "| 順位 | パス | セクション | カテゴリ | クリック | 表示 | 掲載順位 |", "|---|---|---|---|---|---|---|");
  pages.forEach((p, i) => {
    lines.push(
      `| ${i + 1} | \`${p.path}\` | ${labelFor("section", p.section, ctx)} | ${labelFor("category", p.category, ctx)} | ${int(p.clicks)} | ${int(p.impressions)} | ${p.position.toFixed(1)} |`,
    );
  });
  lines.push("");

  const queries = snap.queries.map((q) => ({ query: q.query, clicks: num(q.clicks), impressions: num(q.impressions), position: num(q.position) }));
  lines.push(
    `### 上位の検索語 (${TOP_QUERIES} 件)`,
    "",
    `キーワード表に載るのはクリック全体の ${pct(total.query_capture_rate)} だけである。残りは GSC が検索語を伏せた分で、推定で埋めない。`,
    "",
    "| 順位 | 検索語 | クリック | 表示 | CTR | 掲載順位 |",
    "|---|---|---|---|---|---|",
  );
  queries
    .slice()
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, TOP_QUERIES)
    .forEach((q, i) => {
      lines.push(`| ${i + 1} | ${q.query} | ${int(q.clicks)} | ${int(q.impressions)} | ${pct(ratio(q.clicks, q.impressions))} | ${q.position.toFixed(1)} |`);
    });
  lines.push("");

  const lowCtr = queries
    .filter((q) => q.impressions >= LOW_CTR_MIN_IMPRESSIONS && q.clicks / q.impressions < LOW_CTR_MAX)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, LOW_CTR_TOP);
  lines.push(
    `### 表示が多いのにクリックが少ない語 (表示 ${LOW_CTR_MIN_IMPRESSIONS} 以上・CTR ${(LOW_CTR_MAX * 100).toFixed(0)}% 未満・${LOW_CTR_TOP} 件)`,
    "",
  );
  if (lowCtr.length === 0) {
    lines.push("_該当なし_");
  } else {
    lines.push("| 検索語 | 表示 | クリック | CTR | 掲載順位 |", "|---|---|---|---|---|");
    for (const q of lowCtr) {
      lines.push(`| ${q.query} | ${int(q.impressions)} | ${int(q.clicks)} | ${pct(ratio(q.clicks, q.impressions))} | ${q.position.toFixed(1)} |`);
    }
  }
  lines.push("");
  return lines;
}

function weeklySection(week, weeklyRows, snap) {
  const lines = ["## 3. 前週比 (確定 7 日どうし)", ""];
  const s = snap.summary;
  if (s?.wow && s.finalized7d && s.previous7d) {
    const f = s.finalized7d;
    const p = s.previous7d;
    lines.push(
      `サイト全体のクリック: ${int(f.kpis.clicks)} (${f.periodStart} 〜 ${f.periodEnd}) / 直前 7 日 ${int(p.kpis.clicks)} (${p.periodStart} 〜 ${p.periodEnd})・` +
        `${s.wow.clicks.delta >= 0 ? "+" : ""}${s.wow.clicks.delta} (${s.wow.clicks.pct >= 0 ? "+" : ""}${s.wow.clicks.pct}%)`,
      "",
    );
  } else {
    lines.push("サイト全体の確定 7 日の前週比は summary.json に無い (取得の欠け)。", "");
  }
  const prevWeek = previousIsoWeek(week);
  const cur = weeklyRows.filter((r) => r.window_week === week);
  const prev = weeklyRows.filter((r) => r.window_week === prevWeek);
  const curTotal = cur.find((r) => r.dimension === "total");
  const prevTotal = prev.find((r) => r.dimension === "total");
  const consecutive = curTotal && prevTotal && addDays(prevTotal.period_end, 1) === curTotal.period_start;
  if (!consecutive) {
    const have = [...new Set(weeklyRows.map((r) => r.window_week))].length;
    lines.push(
      `カテゴリ別の前週比は、確定 7 日の明細 (\`${PAGES_FINALIZED_FILE}\`) が期間の連続する 2 週分そろうまで出さない (現在 ${have} 週分)。` +
        "28 日窓の差で代用しない。",
      "",
    );
    return lines;
  }
  lines.push(coverageLine(curTotal), "");
  lines.push("| カテゴリ | 今週 | 前週 | 差 | 今週の割合 |", "|---|---|---|---|---|");
  const prevBy = new Map(prev.filter((r) => r.dimension === "category").map((r) => [r.key, r]));
  for (const r of cur.filter((x) => x.dimension === "category")) {
    const p = prevBy.get(r.key);
    const diff = num(r.clicks) - num(p?.clicks);
    lines.push(`| ${r.label} | ${int(r.clicks)} | ${p ? int(p.clicks) : "-"} | ${diff >= 0 ? "+" : ""}${diff} | ${pct(r.click_share)} |`);
  }
  lines.push("");
  return lines;
}

/** DEMAND-LATEST.md を描画する。 */
export function renderDemandLatest({ week, historyRows, latestRows, weeklyRows, snap, ctx }) {
  const lines = [
    `# 検索の需要 — ${week}`,
    "",
    "「何にアクセスが集まっているか」はこのファイルと長期の集計 `demand-history.csv` (重ならない 28 日窓) から答える。",
    "生の `snapshots/<週>/queries.csv` から直接答えない (クリックの一部しか載らず、期間は 28 日で週ごとに重なる)。",
    "",
    "- カテゴリはランキングの指標の category、ブログは台帳 rankingKeys の指標のカテゴリの多数決で付ける。地域・テーマ・一覧は「カテゴリなし」。",
    "- 割合は、その窓のページ表 (pages) のクリック合計に対する割合。",
    "- 前週比は確定 7 日どうしだけ。28 日窓が重なる週どうしを前週比と呼ばない。",
    "",
  ];
  lines.push(...longTermSection(historyRows));
  lines.push(...latestSection(latestRows, snap, ctx));
  lines.push(...weeklySection(week, weeklyRows, snap));
  lines.push(
    `履歴: 長期 = [\`${DEMAND_HISTORY_FILE}\`](./${DEMAND_HISTORY_FILE}) / 確定 7 日 = \`${DEMAND_WEEKLY_FILE}\` (明細のある週だけ) / 生成: \`npm run metrics:digest -- <週> --source gsc\``,
    "",
  );
  return lines.join("\n");
}

// ── 書き出し ────────────────────────────────────────────────

/**
 * 全 snapshot から長期・確定 7 日の集計と DEMAND-LATEST.md を作り直す (week 以前の snapshot だけを使う)。
 * @returns {{windows:string[], weeklyWeeks:string[], latest:string}|null} week の snapshot が無ければ null
 */
export function writeGscDemand({ root, week, ctx = loadDemandContext(root) }) {
  const snapRoot = join(root, datasetDir("gsc.snapshots"));
  const outDir = join(root, datasetDir("gsc.history"));
  const weeks = readdirSync(snapRoot)
    .filter((w) => /^\d{4}-W\d{2}$/.test(w) && w <= week)
    .sort();
  const snaps = weeks.map((w) => readWeekSnapshot(join(snapRoot, w), w)).filter(Boolean);
  const latest = snaps.find((s) => s.week === week);
  if (!latest) return null;

  const windows = selectNonOverlappingWindows(snaps);
  const historyRows = windows.flatMap((s) => rollingRows(s, ctx));
  writeFileSync(join(outDir, DEMAND_HISTORY_FILE), toCsv(historyRows, [...DEMAND_FIELDS]), "utf8");

  const weeklyRows = snaps.flatMap((s) => finalizedRows(s, ctx) ?? []);
  if (weeklyRows.length > 0) {
    writeFileSync(join(outDir, DEMAND_WEEKLY_FILE), toCsv(weeklyRows, [...DEMAND_FIELDS]), "utf8");
  }

  const latestRows = rollingRows(latest, ctx);
  const md = renderDemandLatest({ week, historyRows, latestRows, weeklyRows, snap: latest, ctx });
  writeFileSync(join(outDir, DEMAND_LATEST_FILE), md, "utf8");
  return {
    windows: windows.map((s) => s.week),
    weeklyWeeks: [...new Set(weeklyRows.map((r) => String(r.window_week)))],
    latest: week,
  };
}
