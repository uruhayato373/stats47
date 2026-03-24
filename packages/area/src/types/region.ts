/**
 * 地域ブロック
 */
export interface Region {
  /** 地域ブロックコード（例: "hokkaido_tohoku"） */
  regionCode: string;
  /** 地域ブロック名（例: "北海道・東北"） */
  regionName: string;
  /** 都道府県リスト（5桁コード） */
  prefectures: string[];
  /** チャート描画色（例: "#3b82f6"） */
  color: string;
}
