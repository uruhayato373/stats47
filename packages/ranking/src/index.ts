/**
 * Ranking Package Entry Point (Client)
 */

export * from "./types";
export * from "./utils";
// 市区町村分布のビン化 (pure)。apps/web のヒストグラムと snapshot builder の焼き込みが共用する
export {
  binMunicipalityValues,
  type MunicipalityDistribution,
  type MunicipalityDistributionBin,
} from "./municipalities/bin-municipality-values";
// 市区町村の名前・データブック・title (純粋関数。指標 registry を読まない)
export * from "./municipalities/municipality-ai-content";
export * from "./municipalities/municipality-names";
export * from "./municipalities/municipality-page-meta";
export * from "./municipalities/municipality-prefecture-ranking";
export * from "./municipalities/build-city-databooks";
// home/featured.json 派生の pure helper (R2 非依存)。exporter と apps/web の dev 補完が共用する
export {
  bakeHomeFeaturedItem,
  deriveFeaturedTop,
  deriveFeaturedTopList,
  resolveHomeFeaturedItems,
  type HomeFeaturedValueRow,
} from "./exporters/home-featured";
// builder と調査分類は data-configs の全指標 registry を読むので、クライアント入口に置かない。
// builder は `@stats47/ranking/server`、調査分類は `@stats47/ranking/survey` で読む (2026-10-21: 開発ビルドでランキング詳細のブラウザ向けに
// 指標定義 2,648 件が入り、初回コンパイルが最大 171 秒かかっていた)。
