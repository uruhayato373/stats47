/**
 * page-type — GA4 built-in pagePath を決定的に page type へ分類する (pure)。
 *
 * 本ファイルが AdSense / GA4 のpage type決定的分類のコード SSOT。
 * 高カーディナリティな custom dimension (page_type / URL) を GA4 側に新設しない —
 * 分類は常にローカルのこの関数で行う。
 *
 * テスト: __tests__/adsense-diagnostics.test.mjs 内
 */

export const PAGE_TYPES = Object.freeze([
  "ranking-detail",
  "blog-detail",
  "area-detail",
  "theme-detail",
  "category",
  "search",
  "home",
  "other",
]);

/** pagePath (path + 任意の query) → page type。決定的・網羅 (最後は other)。 */
export function classifyPageType(pagePath) {
  if (typeof pagePath !== "string" || pagePath.length === 0) return "other";
  const path = pagePath.split("?")[0].split("#")[0];
  if (path === "/" || path === "") return "home";
  if (path === "/search" || path.startsWith("/search/")) return "search";
  if (/^\/ranking\/[^/]+\/?$/.test(path)) return "ranking-detail";
  if (/^\/blog\/[^/]+\/?$/.test(path)) return "blog-detail";
  if (/^\/areas\/[^/]+/.test(path)) return "area-detail";
  if (/^\/themes\/[^/]+\/?$/.test(path)) return "theme-detail";
  if (/^\/category\/[^/]+\/?$/.test(path)) return "category";
  return "other";
}

/** GA4 pages.csv 行群を page type 別に集計する (metricKeys は数値合算)。 */
export function aggregateByPageType(rows, { pathKey = "pagePath", metricKeys = [] } = {}) {
  const out = {};
  for (const t of PAGE_TYPES) out[t] = { pageType: t, pages: 0, ...Object.fromEntries(metricKeys.map((k) => [k, 0])) };
  for (const r of rows ?? []) {
    const t = classifyPageType(r[pathKey]);
    out[t].pages += 1;
    for (const k of metricKeys) {
      const n = Number(r[k]);
      if (Number.isFinite(n)) out[t][k] += n;
    }
  }
  return out;
}
