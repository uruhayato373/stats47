/** タイルプロバイダー定義 */

export interface TileProvider {
  url: string;
  attribution: string;
  label: string;
  maxZoom?: number;
}

/**
 * 背景タイルは国土地理院の地理院タイルをブラウザから直接リアルタイム取得する。
 *
 * 2026-09-23 に CARTO basemap がキー無し配信へ「API KEY REQUIRED」の透かしを入れ始め、
 * 同一 origin の /tiles/* プロキシ (30 日 immutable キャッシュ) ごと廃止した。
 * 地理院タイルはウェブサイト上でリアルタイムに読み込む利用なら出典明示のみで申請不要
 * (https://maps.gsi.go.jp/development/ichiran.html 2026-09-25 確認)。キャッシュ・
 * プロキシ配信は同ページに記載が無いため行わない。出典には一覧ページへのリンクが必須。
 * 地理院タイルに暗色の地図は無いので、ダークモードでも淡色地図を使う。
 */
const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>';

const GSI_PALE: TileProvider = {
  url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
  attribution: GSI_ATTRIBUTION,
  label: "淡色地図",
  maxZoom: 18,
};

const GSI_STD: TileProvider = {
  url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
  attribution: GSI_ATTRIBUTION,
  label: "標準地図",
  maxZoom: 18,
};

/** テーマ別デフォルトタイル（light/dark 自動切替用） */
export const TILE_PROVIDERS = {
  light: GSI_PALE,
  dark: GSI_PALE,
} as const;

/** ユーザーが切り替え可能なタイルプロバイダー一覧（light / dark 各セット） */
export const TILE_OPTIONS_LIGHT: TileProvider[] = [GSI_PALE, GSI_STD];

export const TILE_OPTIONS_DARK: TileProvider[] = [GSI_PALE, GSI_STD];

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
 * URL は既定タイル (TILE_PROVIDERS.light) と同じ文字列にする。違うと preload が使われない。
 */
export function getInitialMapTileUrls(): string[] {
  const { x: cx, y: cy } = latLngToTile(JAPAN_CENTER[0], JAPAN_CENTER[1], JAPAN_ZOOM);
  const urls: string[] = [];
  for (const dx of [0, 1]) {
    for (const dy of [0, 1]) {
      urls.push(
        TILE_PROVIDERS.light.url
          .replace("{z}", String(JAPAN_ZOOM))
          .replace("{x}", String(cx + dx))
          .replace("{y}", String(cy + dy))
      );
    }
  }
  return urls;
}
