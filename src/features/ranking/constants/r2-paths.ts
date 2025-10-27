/**
 * Ranking ドメインのR2パス定義
 * 統合バケット内でのディレクトリパスを定義
 */

export const RANKING_R2_PATHS = {
  /** ランキング値データの保存パス */
  VALUES: "ranking/values",

  /** ランキングメタデータの保存パス */
  METADATA: "ranking/metadata",
} as const;

/**
 * R2パスの完全なキーを生成
 */
export function buildRankingR2Key(
  type: keyof typeof RANKING_R2_PATHS,
  ...pathSegments: (string | number)[]
): string {
  const basePath = RANKING_R2_PATHS[type];
  return `${basePath}/${pathSegments.join("/")}`;
}

/**
 * ランキング値データのR2キーを生成
 * @param rankingKey - ランキングキー
 * @param timeCode - 時点コード
 * @returns R2キー (例: 'ranking/values/total-population/2020000000.json')
 */
export function buildRankingValueKey(
  rankingKey: string,
  timeCode: string
): string {
  return buildRankingR2Key("VALUES", rankingKey, `${timeCode}.json`);
}

/**
 * ランキングメタデータのR2キーを生成
 * @param subcategoryId - サブカテゴリID
 * @returns R2キー (例: 'ranking/metadata/basic-population.json')
 */
export function buildRankingMetadataKey(subcategoryId: string): string {
  return buildRankingR2Key("METADATA", `${subcategoryId}.json`);
}
