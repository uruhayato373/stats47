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
export declare function computeDescriptiveStats(data: number[]): DescriptiveStats | null;
