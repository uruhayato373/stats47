/**
 * ランキングデータの統計計算結果
 */
export interface RankingStats {
  /** 合計値 */
  sum: number;
  /** 平均値 */
  mean: number;
  /** 中央値 */
  median: number;
  /** 最大値 */
  max: number;
  /** 最小値 */
  min: number;
  /** 標準偏差 */
  standardDeviation: number;
  /** 変動係数（%） */
  coefficientOfVariation: number;
  /** バリエーションがあるか（標準偏差 > 0） */
  hasVariation: boolean;
  /** データ件数（全国データ除外後） */
  count: number;
}
