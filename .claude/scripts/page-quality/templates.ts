import { isoWeekOf } from "../metrics/lib/periods.mjs";
import type { PageTemplate, PageTemplateKey, SharedPathRule } from "./types";

/**
 * ページテンプレート台帳 (監査対象の代表URL + 変更検知glob)。
 *
 * URL一覧の独自SSOTではない — 週次の全URL監査は sitemap.ts と同じ生成ロジック
 * (apps/web/src/config/sitemap-segments.ts 等) を list-all-urls.ts が直接importして使う。
 * ここが持つのは「変更時に1件だけ叩く代表URL」と「どのファイル変更がどのテンプレートに
 * 影響するか」の対応表だけ。
 */
export const PAGE_TEMPLATES: readonly PageTemplate[] = [
  {
    key: "home",
    label: "ホーム",
    representativeUrl: "/",
    changedPathGlobs: [
      "apps/web/src/app/page.tsx",
      "apps/web/src/features/home-portal/**",
    ],
  },
  {
    key: "prefecture-list",
    label: "都道府県一覧",
    representativeUrl: "/areas",
    changedPathGlobs: ["apps/web/src/app/areas/page.tsx"],
  },
  {
    key: "prefecture-detail",
    label: "都道府県詳細",
    representativeUrl: "/areas/13000",
    variants: [
      { id: "hokkaido", url: "/areas/01000", why: "面積最大・市町村数最多の県" },
      { id: "okinawa", url: "/areas/47000", why: "離島を含む県 (地図の範囲・凡例の重なり)" },
      { id: "theme-population", url: "/areas/13000/population-dynamics", why: "県×テーマ (グラフ多数・人口移動フロー)" },
      { id: "theme-geo", url: "/areas/02000/landslide-exposure", why: "県×テーマの Geo 型 (区域地図・検算表)" },
      { id: "theme-care", url: "/areas/47000/long-term-care", why: "県×テーマ (分布地図・相関指標)" },
    ],
    changedPathGlobs: [
      "apps/web/src/app/areas/[areaCode]/**",
      "apps/web/src/app/areas/[areaCode]/[themeSlug]/**",
      "apps/web/src/features/area-profile/**",
      "apps/web/src/features/area-databook/**",
    ],
  },
  {
    key: "municipality",
    label: "市区町村",
    representativeUrl: "/areas/13000/cities/13101",
    variants: [
      { id: "designated-city", url: "/areas/01000/cities/01100", why: "政令指定都市 (一覧が長い)" },
      { id: "village", url: "/areas/29000/cities/29363", why: "小さな村 (値 0・欠測が多い)" },
    ],
    changedPathGlobs: [
      "apps/web/src/app/areas/[areaCode]/cities/**",
      "apps/web/src/features/municipalities/**",
    ],
  },
  {
    key: "ranking",
    label: "ランキング",
    representativeUrl: "/ranking/total-population",
    variants: [
      { id: "index", url: "/ranking", why: "ランキング一覧" },
      { id: "old-2years", url: "/ranking/national-pension-full-exemption-rate", why: "2005〜2006 年の 2 年分だけの古いデータ" },
      { id: "single-year", url: "/ranking/junior-high-club-per100-swimming", why: "観測 1 年だけ・同名の指標が多い" },
      { id: "long-title", url: "/ranking/smartphone-usage-rate-by-sex", why: "長い指標名" },
      { id: "negative", url: "/ranking/population-growth-rate", why: "負の値を含む" },
      { id: "kakei-city", url: "/ranking/natto-consumption-expenditure", why: "県庁所在市の値 (家計調査・世帯あたり)" },
    ],
    changedPathGlobs: [
      "apps/web/src/app/ranking/**",
      "apps/web/src/features/ranking/**",
      "apps/web/src/components/molecules/DataSourceList.tsx",
    ],
  },
  {
    key: "category",
    label: "カテゴリ",
    representativeUrl: "/category/population",
    variants: [
      { id: "landweather", url: "/category/landweather", why: "別カテゴリ (記事カード・単位の違い)" },
    ],
    changedPathGlobs: ["apps/web/src/app/category/**"],
  },
  {
    key: "theme",
    label: "テーマ",
    representativeUrl: "/themes/population-dynamics",
    variants: [
      { id: "index", url: "/themes", why: "テーマ一覧" },
      { id: "real-income", url: "/themes/real-income", why: "表と金額の単位が多いテーマ" },
    ],
    changedPathGlobs: [
      "apps/web/src/app/themes/**",
      "apps/web/src/features/theme-dashboard/**",
    ],
  },
  {
    key: "geo-analysis",
    label: "地域分析",
    representativeUrl: "/geo",
    variants: [
      { id: "analysis", url: "/geo/population-land-price", why: "空間分析の本体 (47 県の全データ表)" },
      { id: "analysis-pref", url: "/geo/population-flood-risk/15/overlap", why: "県別の重なり (検算の式)" },
      { id: "compare", url: "/geo/compare", why: "分析の横断比較" },
      { id: "layer", url: "/geo/layers/population-mesh", why: "補助レイヤー (メッシュの凡例)" },
      { id: "dataset", url: "/geo/datasets/A03", why: "原典データセット (配布区画)" },
    ],
    changedPathGlobs: [
      "apps/web/src/app/geo/**",
      "apps/web/src/features/geo-analysis/**",
      "apps/web/src/features/map-visualization/**",
    ],
  },
  {
    key: "blog",
    label: "統計ブログ",
    representativeUrl: "/blog",
    changedPathGlobs: [
      "apps/web/src/app/blog/**",
      "apps/web/src/features/blog/**",
    ],
  },
  {
    // 記事詳細は一覧と別のレイアウト (本文・図・ページ末尾の「データ出典」)。一覧だけでは崩れを検出できない
    key: "blog-article",
    label: "統計ブログ記事",
    representativeUrl: "/blog/beer-peak-month-july-to-december",
    variants: [
      { id: "charts", url: "/blog/local-government-debt-burden", why: "図表が多い高流入の記事" },
    ],
    changedPathGlobs: [
      "apps/web/src/app/blog/[slug]/**",
      "apps/web/src/features/blog/**",
      "apps/web/src/components/molecules/DataSourceList.tsx",
    ],
  },
  {
    key: "survey",
    label: "survey",
    representativeUrl: "/survey/census",
    variants: [
      { id: "index", url: "/survey", why: "調査一覧 (約 100 件)" },
      { id: "police", url: "/survey/police-statistics", why: "別の調査 (関連記事)" },
    ],
    changedPathGlobs: [
      "apps/web/src/app/survey/**",
      "apps/web/src/features/survey/**",
    ],
  },
  {
    key: "other",
    label: "その他の公開ページ",
    representativeUrl: "/tag/population",
    variants: [
      { id: "municipalities", url: "/municipalities", why: "市区町村のハブ" },
      { id: "municipalities-theme", url: "/municipalities/themes/aging-society", why: "市区町村のテーマ (ヒストグラム)" },
      { id: "municipalities-ranking", url: "/municipalities/ranking/junior-high-school-count", why: "市区町村のランキング表" },
      { id: "municipalities-pref-ranking", url: "/municipalities/ranking/manufacturing-shipment-amount/23000", why: "県名×市区町村ランキング (県内の地図・要約・47 県リンク。外れ値の大きい指標)" },
      { id: "municipalities-pref-ranking-tokyo", url: "/municipalities/ranking/per-taxpayer-income/13000", why: "県名×市区町村ランキングの東京都 (特別区を含む・島嶼の地図範囲)" },
      { id: "japan", url: "/japan", why: "日本全体のハブ" },
      { id: "japan-theme", url: "/japan/education-culture", why: "日本全体のテーマ (時系列グラフ)" },
      { id: "products", url: "/products", why: "商品一覧" },
      { id: "product-item", url: "/products/data-p-01", why: "商品詳細" },
      { id: "about", url: "/about", why: "固定ページ" },
    ],
    changedPathGlobs: [
      "apps/web/src/app/tag/**",
      "apps/web/src/app/compare/**",
      "apps/web/src/app/japan/**",
      "apps/web/src/app/municipalities/**",
    ],
  },
];

/**
 * 共通レイアウト・広告・データ取得層。変更時は全テンプレートを横断検査する。
 */
export const SHARED_PATH_RULES: readonly SharedPathRule[] = [
  {
    label: "共通レイアウト",
    changedPathGlobs: [
      "apps/web/src/components/layout/**",
      "apps/web/src/components/ui/**",
      "apps/web/src/app/layout.tsx",
      "apps/web/src/app/globals.css",
      "apps/web/src/components/rail/**",
      "apps/web/tailwind.config.ts",
      "apps/web/postcss.config.mjs",
    ],
  },
  {
    label: "広告",
    changedPathGlobs: [
      "apps/web/src/features/ads/**",
      "apps/web/scripts/affiliate-ads-data.ts",
    ],
  },
  {
    label: "共通データ取得層",
    changedPathGlobs: [
      "packages/r2-storage/**",
      "apps/web/src/lib/structured-data/**",
    ],
  },
];

const globToRegExp = (glob: string): RegExp => {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, " ")
    .replace(/\*/g, "[^/]*")
    .replace(/ /g, ".*");
  return new RegExp(`^${escaped}$`);
};

function matchesAny(path: string, globs: readonly string[]): boolean {
  return globs.some((glob) => globToRegExp(glob).test(path));
}

/**
 * git diff の変更ファイル一覧から、影響するテンプレートを決める。
 * 共通ファイルへの変更は全テンプレートを返す。該当なしは空配列。
 */
export function affectedTemplates(
  changedFiles: readonly string[]
): PageTemplate[] {
  if (changedFiles.length === 0) return [];

  const touchesShared = SHARED_PATH_RULES.some((rule) =>
    changedFiles.some((file) => matchesAny(file, rule.changedPathGlobs))
  );
  if (touchesShared) return [...PAGE_TEMPLATES];

  return PAGE_TEMPLATES.filter((template) =>
    changedFiles.some((file) => matchesAny(file, template.changedPathGlobs))
  );
}

/** ブラウザ検査・撮影するページ。代表URLは `template`、データの型の違いは `<template>--<variant id>` を key にする。 */
export interface BrowserPage {
  key: string;
  template: PageTemplateKey;
  url: string;
  variantId: string | null;
}

export const pageKey = (template: string, variantId?: string | null): string =>
  variantId ? `${template}--${variantId}` : template;

/** 週次でブラウザ検査・撮影する全ページ (代表URL + 全 variants)。機械検査は毎週すべてを見る。 */
export function browserPages(): BrowserPage[] {
  return PAGE_TEMPLATES.flatMap((t) => [
    { key: pageKey(t.key), template: t.key, url: t.representativeUrl, variantId: null },
    ...(t.variants ?? []).map((v) => ({ key: pageKey(t.key, v.id), template: t.key, url: v.url, variantId: v.id })),
  ]);
}

/**
 * agent (Claude) が画面を確認する週の周期。代表URLは毎週、variants はこの週数で 1 巡する。
 * 全ページを毎週見ると 1 回の確認が 40 ページ超になり、ターン数・画像数の上限と費用が見合わない。
 */
export const REVIEW_ROTATION_WEEKS = 4;

/** ISO 週番号 (1〜53)。 */
export function isoWeek(date: string): number {
  // 正本は .claude/scripts/metrics/lib/periods.mjs (SCRIPT-ISO-WEEK-UNIFY-01)
  return Number(isoWeekOf(date.slice(0, 10)).slice(6));
}

/** その週に agent が確認するページの key。代表URLは毎週、variants は key 順に並べて週番号で割り振る。 */
export function reviewPageKeys(date: string): string[] {
  const pages = browserPages();
  const variants = pages.filter((p) => p.variantId).map((p) => p.key).sort();
  const slot = isoWeek(date) % REVIEW_ROTATION_WEEKS;
  return [
    ...pages.filter((p) => !p.variantId).map((p) => p.key),
    ...variants.filter((_, i) => i % REVIEW_ROTATION_WEEKS === slot),
  ];
}
