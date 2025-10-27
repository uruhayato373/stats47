/**
 * 地図描画ドメイン - エクスポート
 * 地理データの可視化（ライブラリ非依存）
 */

// 型定義
export type {
  ChoroplethConfig,
  ChoroplethData,
  MapConfig,
  MapControls,
  MapEvents,
  MapProps,
  MapState,
  MapStyle,
} from "./types";

// コンポーネント
export { PrefectureMap } from "./common/PrefectureMap";
export { PrefectureMapD3 } from "./d3/PrefectureMapD3";
export { MapLegend } from "./components";

// ユーティリティ
export {
  createColorScale,
  createChoroplethColorMapper,
  createLegendData,
} from "./utils/color-scale";
