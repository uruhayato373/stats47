import type { RankingValue } from "@stats47/ranking";

/**
 * 47都道府県のランキングデータから年度別の全国平均値を算出
 *
 * ranking_data に全国（00000）データがない指標に対して、
 * 各年度の47都道府県値の算術平均を全国値として返す。
 */
export function computeNationalAverage(
  allData: RankingValue[],
): Map<string, { value: number; yearName: string }> {
  // yearCode ごとにグルーピング
  const byYear = new Map<string, { values: number[]; yearName: string }>();
  for (const v of allData) {
    const entry = byYear.get(v.yearCode);
    if (entry) {
      entry.values.push(v.value);
    } else {
      byYear.set(v.yearCode, {
        values: [v.value],
        yearName: v.yearName ?? v.yearCode,
      });
    }
  }

  const result = new Map<string, { value: number; yearName: string }>();
  for (const [yearCode, entry] of byYear) {
    const avg = entry.values.reduce((a, b) => a + b, 0) / entry.values.length;
    result.set(yearCode, {
      value: Math.round(avg * 100) / 100,
      yearName: entry.yearName,
    });
  }

  return result;
}
