/** タイルプロバイダー定義 */

export interface TileProvider {
  url: string;
  attribution: string;
  label: string;
  maxZoom?: number;
}

/** テーマ別デフォルトタイル（light/dark 自動切替用） */
export const TILE_PROVIDERS = {
  light: {
    url: "/tiles/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "CartoDB Light",
  },
  dark: {
    url: "/tiles/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "CartoDB Dark",
  },
} as const;

/** ユーザーが切り替え可能なタイルプロバイダー一覧（light / dark 各セット） */
export const TILE_OPTIONS_LIGHT: TileProvider[] = [
  {
    url: "/tiles/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "CartoDB",
  },
  {
    url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    attribution:
      '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    label: "地理院淡色",
    maxZoom: 18,
  },
];

export const TILE_OPTIONS_DARK: TileProvider[] = [
  {
    url: "/tiles/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "CartoDB",
  },
  {
    url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    attribution:
      '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    label: "地理院淡色",
    maxZoom: 18,
  },
];

/** @deprecated isDark を渡して TILE_OPTIONS_LIGHT / TILE_OPTIONS_DARK を使うこと */
export const TILE_OPTIONS: TileProvider[] = TILE_OPTIONS_LIGHT;

/** 日本中心の初期表示設定 */
export const JAPAN_CENTER: [number, number] = [36.5, 137.5];
export const JAPAN_ZOOM = 5;
export const JAPAN_MIN_ZOOM = 4;
export const JAPAN_MAX_ZOOM = 14;

/**
 * 緯度経度から Slippy Map タイル座標に変換（OSM / CartoCDN / 地理院共通）
 */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/**
 * LCP 対策: 初期ビュー（日本中心・zoom 5）で描画される tile URL を算出する。
 * Server Component から <link rel="preload"> を emit して Leaflet JS 実行前に fetch を開始する。
 *
 * 2×2 = 4 タイル（中心タイル + 右・下・右下）を preload 対象とする。
 * mobile viewport (375×500 @2x) で実際にレンダリングされる最小構成。
 */
export function getInitialMapTileUrls(options: {
  theme: "light_all" | "dark_all";
  retina?: boolean;
}): string[] {
  const { theme, retina = true } = options;
  const { x: cx, y: cy } = latLngToTile(JAPAN_CENTER[0], JAPAN_CENTER[1], JAPAN_ZOOM);
  const suffix = retina ? "@2x.png" : ".png";
  const urls: string[] = [];
  for (const dx of [0, 1]) {
    for (const dy of [0, 1]) {
      urls.push(`/tiles/${theme}/${JAPAN_ZOOM}/${cx + dx}/${cy + dy}${suffix}`);
    }
  }
  return urls;
}
