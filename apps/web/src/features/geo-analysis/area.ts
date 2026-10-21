/**
 * 県ページが使う Geo セクションだけの最小 entrypoint。`./index` (/geo 全体) と `./embedded` (テーマ用の地図部品) を
 * 読むと地図 explorer・leaflet まで県ページの bundle に入る。
 */
export { AreaGeoInsightsSection } from './components/AreaGeoInsightsSection';
