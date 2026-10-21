/**
 * 他の feature (テーマ・Geo) が組み込むランキング部品だけの最小 entrypoint。
 * `./index` は定義カード (katex で数式を描く) や一覧表まで export するため、
 * テーマのダッシュボードが年セレクタ 1 つを読むだけでそれらが bundle に入っていた。
 */
export { RankingMapChartClient } from "./components/RankingMapChart/RankingMapChartClient";
export { RankingYearSelector } from "./components/RankingPageHeader/RankingYearSelector";
