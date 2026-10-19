export {
  generateMiniPrefectureSvg,
  generatePrefectureOverviewSvg,
  MINI_PREFECTURE_THUMBNAIL_LAYOUT,
  readPrefectureFeatures,
} from './generate-mini-prefecture-svg';
export {
  generateRankingThumbnailMapSvg,
} from './generate-ranking-thumbnail-map-svg';
// Static images share the map/legend resolver used by the ranking page.
export { resolveChoroplethScale } from '../d3/utils/color-scale/resolve-choropleth-scale';
export { createLegendFormatter } from '../d3/utils/color-scale/legend-format';
