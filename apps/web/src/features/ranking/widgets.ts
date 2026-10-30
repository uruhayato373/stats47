/**
 * 他の feature (テーマ・Geo) が組み込むランキング部品だけの最小 entrypoint。
 * `./index` は定義カード (katex で数式を描く) や一覧表まで export するため、
 * テーマのダッシュボードが年セレクタ 1 つを読むだけでそれらが bundle に入っていた。
 */
export { RankingMapChartClient } from "./components/RankingMapChart/RankingMapChartClient";
export { RankingYearSelector } from "./components/RankingPageHeader/RankingYearSelector";
// 地図と表を 1 枚に描くパネル。ランキングのページとテーマの「都道府県の分布」が同じ部品を使う (2026-10-30)
export { RankingVisualizationSection } from "./components/RankingKeyPage/RankingVisualizationSection";
