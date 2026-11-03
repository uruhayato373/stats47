import { TILE_PROVIDERS } from '@stats47/visualization/leaflet/constants';

/** 表示専用。リアルタイム取得のみで、分析入力や配布bundleに含めない。
 * https://www.gsi.go.jp/LAW/2930-qa.html Q1-12
 * https://maps.gsi.go.jp/development/ichiran.html 淡色地図: 全球 ZL2–8、日本 ZL5–18
 */
export const GEO_BASEMAP = {
  // 地理院の淡色地図の URL は共通の背景タイル定義から読む (2 か所に書かない)
  url: TILE_PROVIDERS.light.url,
  attribution:
    '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>（stats47が分析を重ね合わせ）',
  minZoom: 5,
  minNativeZoom: 2,
  maxZoom: 17,
} as const;
export const GEO_BASEMAP_SHORELINE_ATTRIBUTION =
  '小縮尺背景の海岸線：United States. National Imagery and Mapping Agency. “Vector Map Level 0 (VMAP0).” Bethesda, MD: Denver, CO: The Agency; USGS Information Services, 1997.';
