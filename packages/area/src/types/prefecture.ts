/**
 * 都道府県エンティティ
 */
export interface Prefecture {
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 都道府県名 */
  prefName: string;
  /** 小文字ローマ字 (例: "hokkaido")。楽天のエリア slug・IPSS のファイル名と同じ表記 */
  romaji: string;
}
