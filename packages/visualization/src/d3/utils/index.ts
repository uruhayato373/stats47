// packages/visualization/src/d3/utils/index.ts
export * from "./color-scale";
export { mapConfigToColorOptions } from "./convert-map-config";
export { getThemeColors } from "./get-theme-colors";
export type { ThemeColors } from "./get-theme-colors";
export { preparePrefectureFeatures } from "./geojson";

export {
  computeFittedViewBox,
  fitSvgViewBox,
  formatViewBox,
  transformBox,
  VIEWBOX_FIT_PADDING,
} from "./fit-svg-viewbox";
export type { AffineMatrix, ViewBoxRect } from "./fit-svg-viewbox";
