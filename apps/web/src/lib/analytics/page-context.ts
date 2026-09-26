/**
 * ページ文脈 — pathname から GA4 に載せるページ単位のパラメータを決める (pure)。
 *
 * `content_group` は GA4 標準のディメンション (Content group) なので登録枠を使わない。
 * 語彙はページ責務 (docs/01_技術設計/03_情報設計.md「ページ責務」) に合わせた固定値で、
 * 集計側の `.claude/scripts/metrics/lib/page-type.mjs` より細かい。
 * キー類 (ranking_key / theme_slug / area_code / category_key) は URL から決まるものだけを載せる。
 */

export const CONTENT_GROUPS = [
  "home",
  "ranking",
  "ranking_index",
  "municipality_ranking",
  "municipality_theme",
  "municipality_index",
  "theme",
  "theme_index",
  "area",
  "area_theme",
  "city",
  "area_index",
  "blog",
  "blog_index",
  "tag",
  "survey",
  "survey_index",
  "category",
  "geo",
  "japan",
  "product",
  "search",
  "other",
] as const;

export type ContentGroup = (typeof CONTENT_GROUPS)[number];

export interface PageContext {
  content_group: ContentGroup;
  ranking_key?: string;
  theme_slug?: string;
  area_code?: string;
  category_key?: string;
}

/** pathname → ページ文脈。決定的・網羅 (最後は other)。 */
export function resolvePageContext(pathname: string): PageContext {
  const path = (pathname.split("?")[0].split("#")[0] || "/").replace(/\/+$/, "") || "/";
  const seg = path.split("/").filter(Boolean);
  const [first, second, third, fourth] = seg;

  if (path === "/") return { content_group: "home" };
  switch (first) {
    case "ranking":
      return second ? { content_group: "ranking", ranking_key: second } : { content_group: "ranking_index" };
    case "themes":
      return second ? { content_group: "theme", theme_slug: second } : { content_group: "theme_index" };
    case "areas":
      if (!second) return { content_group: "area_index" };
      if (third === "cities" && fourth) return { content_group: "city", area_code: fourth };
      if (third) return { content_group: "area_theme", area_code: second, theme_slug: third };
      return { content_group: "area", area_code: second };
    case "municipalities":
      if (second === "ranking" && third) return { content_group: "municipality_ranking", ranking_key: third };
      if (second === "themes" && third) return { content_group: "municipality_theme", theme_slug: third };
      return { content_group: "municipality_index" };
    case "blog":
      return second ? { content_group: "blog" } : { content_group: "blog_index" };
    case "tag":
      return { content_group: "tag" };
    case "survey":
      return second ? { content_group: "survey" } : { content_group: "survey_index" };
    case "category":
      return second ? { content_group: "category", category_key: second } : { content_group: "other" };
    case "geo":
      return { content_group: "geo" };
    case "japan":
      return { content_group: "japan" };
    case "products":
      return { content_group: "product" };
    case "search":
      return { content_group: "search" };
    default:
      return { content_group: "other" };
  }
}

/** 現在のページの文脈 (ブラウザ外では空)。イベント送信時に都度計算する。 */
export function currentPageContext(): PageContext | Record<string, never> {
  if (typeof window === "undefined") return {};
  return resolvePageContext(window.location.pathname);
}
