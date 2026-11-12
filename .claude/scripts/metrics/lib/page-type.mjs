/**
 * page-type — GA4 built-in pagePath を決定的に page type へ分類する (pure)。
 *
 * 本ファイルが AdSense / GA4 のpage type決定的分類のコード SSOT。
 * 高カーディナリティな custom dimension (page_type / URL) を GA4 側に新設しない —
 * 分類は常にローカルのこの関数で行う。
 *
 * テスト: __tests__/adsense-diagnostics.test.mjs 内
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "../../../../..");

/**
 * テーマのページ (地域の単位に関係なく 1 つの種類。2026-11-12 オーナー決定) の URL の照合。ルートの台帳
 * (content.routes) で pageType = "theme" のルートの pattern を正規表現にし、[themeSlug] はテーマの名前の一覧に
 * 載っているときだけ当てる (/areas/<県>/cities のような同じ形の別のページをテーマに数えない)。
 * 旧: /themes/<テーマ> だけをテーマに数え、表示の 92% を占める /areas/<県>/<テーマ> を「地域」に、/japan と
 * /municipalities/themes を「その他」に数えていた (GSC 2026-W44)
 */
function loadThemeRouteMatchers() {
  const routes = JSON.parse(readFileSync(join(PROJECT_ROOT, datasetPath("content.routes")), "utf8")).routes;
  const themeSlugs = new Set(
    readdirSync(join(PROJECT_ROOT, datasetDir("themes.catalogs")))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -".json".length)),
  );
  const japanSlugs = new Set(
    ["themes.japan-catalogs", "themes.japan-kakei-catalogs"].flatMap((id) =>
      Object.keys(JSON.parse(readFileSync(join(PROJECT_ROOT, datasetPath(id)), "utf8")).themes ?? {}),
    ),
  );
  return routes
    .filter((r) => r.pageType === "theme")
    .map((r) => {
      const params = [];
      const source = r.pattern.replace(/\[([A-Za-z]+)\]/g, (_, name) => {
        params.push(name);
        return "([^/]+)";
      });
      return { regex: new RegExp(`^${source}/?$`), params, slugs: r.scope === "japan" ? japanSlugs : themeSlugs };
    });
}

let themeRouteMatchers;
function isThemePath(path) {
  themeRouteMatchers ??= loadThemeRouteMatchers();
  return themeRouteMatchers.some(({ regex, params, slugs }) => {
    const m = path.match(regex);
    if (!m) return false;
    const slug = m[params.indexOf("themeSlug") + 1];
    return slug !== undefined && slugs.has(decodeURIComponent(slug));
  });
}

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
  if (isThemePath(path)) return "theme-detail";
  if (/^\/areas\/[^/]+/.test(path)) return "area-detail";
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
