/**
 * Visualization ドメインのR2パス定義
 * 統合バケット内でのディレクトリパスを定義
 */

export const VISUALIZATION_R2_PATHS = {
  /** コロプレス地図データの保存パス */
  CHOROPLETH: "visualization/choropleth",
} as const;

/**
 * R2パスの完全なキーを生成
 */
export function buildVisualizationR2Key(
  type: keyof typeof VISUALIZATION_R2_PATHS,
  ...pathSegments: (string | number)[]
): string {
  const basePath = VISUALIZATION_R2_PATHS[type];
  return `${basePath}/${pathSegments.join("/")}`;
}

/**
 * コロプレス地図データのR2キーを生成
 * @param areaCode - 地域コード
 * @param year - 年度
 * @returns R2キー (例: 'visualization/choropleth/01000/2020.json')
 */
export function buildChoroplethKey(areaCode: string, year: number): string {
  return buildVisualizationR2Key("CHOROPLETH", areaCode, `${year}.json`);
}
