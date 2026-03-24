export { LeafletChoroplethMap } from "./components/LeafletChoroplethMap";
export type { LeafletChoroplethMapProps } from "./components/LeafletChoroplethMap";
export { ChoroplethGeoJsonLayer } from "./components/ChoroplethGeoJsonLayer";
export { MapColorLegend } from "./components/MapColorLegend";
export { useTopoJsonToGeoJson } from "./hooks/useTopoJsonToGeoJson";
export { useChoroplethStyle } from "./hooks/useChoroplethStyle";
// TileSwitcher は dynamic import で使用すること（SSR で window エラーを避けるため）
export { TileSwitcher } from "./components/TileSwitcher";
export {
  TILE_PROVIDERS,
  TILE_OPTIONS,
  TILE_OPTIONS_LIGHT,
  TILE_OPTIONS_DARK,
  JAPAN_CENTER,
  JAPAN_ZOOM,
  JAPAN_MIN_ZOOM,
  JAPAN_MAX_ZOOM,
} from "./constants/tile-providers";
export type { TileProvider } from "./constants/tile-providers";
