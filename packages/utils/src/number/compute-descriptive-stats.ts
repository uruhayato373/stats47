/**
 * 記述統計量の計算結果
 */
export interface DescriptiveStats {
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
  /** 分散（標本分散） */
  variance: number;
  /** 標準偏差（標本標準偏差） */
  standardDeviation: number;
  /** 変動係数（%） */
  coefficientOfVariation: number;
  /** データ件数 */
  count: number;
}

/**
 * 数値配列から記述統計量を計算する
 *
 * @param data - 数値配列
 * @returns 記述統計量、またはnull（データが空の場合）
 */
export function computeDescriptiveStats(
  data: number[]
): DescriptiveStats | null {
  if (!data || data.length === 0) return null;

  const count = data.length;

  // 合計値を計算
  const sum = data.reduce((acc, val) => acc + val, 0);

  // 平均値を計算
  const mean = sum / count;

  // 最大値・最小値を計算
  const max = Math.max(...data);
  const min = Math.min(...data);

  // 中央値を計算（ソートが必要）
  const sortedValues = [...data].sort((a, b) => a - b);
  let median: number;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    // 偶数の場合：中央2つの平均
    median = (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  } else {
    // 奇数の場合：中央の値
    median = sortedValues[mid];
  }

  // 分散と標準偏差を計算（標本分散）
  const variance =
    data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const standardDeviation = Math.sqrt(variance);

  // 変動係数を計算（標準偏差 / 平均 * 100）
  // 平均が0の場合は0とする（ゼロ除算回避）
  let coefficientOfVariation = 0;
  if (mean !== 0) {
    coefficientOfVariation = (standardDeviation / Math.abs(mean)) * 100;
  }

  return {
    sum,
    mean,
    median,
    max,
    min,
    variance,
    standardDeviation,
    coefficientOfVariation,
    count,
  };
}
