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

/** テーマ別デフォルトタイル（light/dark 自動切替用） */
export const TILE_PROVIDERS = {
  light: GSI_PALE,
  dark: GSI_PALE,
} as const;
