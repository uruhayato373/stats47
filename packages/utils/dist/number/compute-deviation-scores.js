import { computeDescriptiveStats } from "./compute-descriptive-stats";
/**
 * 偏差値（Z スコア変換: 平均50、標準偏差10）を計算する。
 *
 * @param values - 数値配列
 * @returns 各値に対応する偏差値の配列。データが空の場合は空配列。
 */
export function computeDeviationScores(values) {
    const stats = computeDescriptiveStats(values);
    if (!stats)
        return [];
    return values.map((value) => {
        if (stats.standardDeviation > 0) {
            return 50 + (10 * (value - stats.mean)) / stats.standardDeviation;
        }
        return 50;
    });
}
