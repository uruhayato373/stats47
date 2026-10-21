/**
 * テーマページへ埋め込む Geo 部品だけの最小 entrypoint (県ページ用は `./area`)。
 *
 * `./index` は /geo の全ページ部品 (地図 explorer・katex を使う定義カードなど) も export するため、
 * テーマ・県ページが 1 セクションを出すだけで Geo 全体の依存グラフが dev bundle に入っていた
 * (2026-10-21 実測: /areas/[areaCode] が 20,399 モジュール)。root barrel は /geo のページ用に残す。
 */
export { ThemeGeoPublicFacilityAccessSection } from './components/ThemeGeoPublicFacilityAccessSection';
export { ThemeGeoStationAccessSection } from './components/ThemeGeoStationAccessSection';
export { ThemeGeoLandslideExposureSection } from './components/ThemeGeoLandslideExposureSection';
export { ThemeGeoSnowDesignationSection } from './components/ThemeGeoSnowDesignationSection';
export {
  formatGeoValue,
  GEO_CROSS_ANALYSIS_CONFIGS,
  isGeoCrossAnalysisSlug,
} from './lib/geo-cross-analysis';
export { loadGeoAnalysisSnapshot } from './lib/load-geo-analysis-snapshot';
