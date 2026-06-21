import type { StatsSchema } from "@stats47/types";
import type { PyramidChartData } from "@stats47/visualization/d3";

/**
 * e-Stat の年齢階級別人口データを PyramidChart 用データに変換する。
 *
 * @param maleDataList  男性の各年齢階級データ（最新値のみ使用）
 * @param femaleDataList 女性の各年齢階級データ（同上）
 * @param ageGroups     年齢階級ラベル（省略時はカテゴリ名から抽出）
 * @returns PyramidChartData[]
 */
export function toPyramidChartData(
  maleDataList: StatsSchema[][],
  femaleDataList: StatsSchema[][],
  ageGroups?: string[],
): PyramidChartData[] {
  const result: PyramidChartData[] = [];

  const len = Math.min(maleDataList.length, femaleDataList.length);

  for (let i = 0; i < len; i++) {
    const maleData = maleDataList[i];
    const femaleData = femaleDataList[i];

    // 最新年度のデータを使用
    const latestMale = maleData[maleData.length - 1];
    const latestFemale = femaleData[femaleData.length - 1];

    if (!latestMale || !latestFemale) continue;

    const ageGroup = ageGroups?.[i] ?? `${i}`;

    result.push({
      ageGroup,
      male: -(latestMale.value ?? 0), // 男性は負の値
      female: latestFemale.value ?? 0,
    });
  }

  return result;
}
