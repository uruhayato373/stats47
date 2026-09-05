/** 表示専用。リアルタイム取得のみで、分析入力や配布bundleに含めない。
 * https://www.gsi.go.jp/LAW/2930-qa.html Q1-12
 * https://maps.gsi.go.jp/development/ichiran.html 淡色地図 ZL5–17
 */
export const GEO_BASEMAP = {
  url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
  attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>（stats47が分析を重ね合わせ）',
  minZoom: 5,
  maxZoom: 17,
} as const;
export const GEO_BASEMAP_SHORELINE_ATTRIBUTION = '小縮尺背景の海岸線：United States. National Imagery and Mapping Agency. “Vector Map Level 0 (VMAP0).” Bethesda, MD: Denver, CO: The Agency; USGS Information Services, 1997.';
