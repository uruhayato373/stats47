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
