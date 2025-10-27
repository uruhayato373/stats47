/**
 * e-Stat API ドメインのR2パス定義
 * 統合バケット内でのディレクトリパスを定義
 */

export const ESTAT_API_R2_PATHS = {
  /** e-Statメタ情報の保存パス */
  METAINFO: "estat-api/metainfo",

  /** e-Stat統計データの保存パス */
  STATSDATA: "estat-api/statsdata",

  /** e-Stat統計表リストの保存パス */
  STATSLIST: "estat-api/statslist",
} as const;

/**
 * R2パスの完全なキーを生成
 */
export function buildEstatApiR2Key(
  type: keyof typeof ESTAT_API_R2_PATHS,
  ...pathSegments: (string | number)[]
): string {
  const basePath = ESTAT_API_R2_PATHS[type];
  return `${basePath}/${pathSegments.join("/")}`;
}

/**
 * メタ情報のR2キーを生成
 * @param statsDataId - 統計表ID
 * @returns R2キー (例: 'estat-api/metainfo/0000010102.json')
 */
export function buildMetaInfoKey(statsDataId: string): string {
  return buildEstatApiR2Key("METAINFO", `${statsDataId}.json`);
}

/**
 * 統計データのR2キーを生成
 * @param statsDataId - 統計表ID
 * @param timeCode - 時点コード
 * @returns R2キー (例: 'estat-api/statsdata/0000010102/2020000000.json')
 */
export function buildStatsDataKey(
  statsDataId: string,
  timeCode: string
): string {
  return buildEstatApiR2Key("STATSDATA", statsDataId, `${timeCode}.json`);
}

/**
 * 統計表リストのR2キーを生成
 * @param categoryCode - カテゴリコード
 * @returns R2キー (例: 'estat-api/statslist/A.json')
 */
export function buildStatsListKey(categoryCode: string): string {
  return buildEstatApiR2Key("STATSLIST", `${categoryCode}.json`);
}
