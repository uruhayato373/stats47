import type { StatsSchema } from "@stats47/types";
import type { BarChartRaceFrame } from "@stats47/visualization/d3";

/**
 * e-Stat 生データをバーチャートレース用フレーム配列に変換
 *
 * @param rawData - e-Stat 生データ（時系列・カテゴリ別）
 * @returns BarChartRaceFrame[]（date, items: { name, value }[]）
 */
export function toBarChartRaceData(
  rawData: StatsSchema[]
): BarChartRaceFrame[] {
  const timeMap = new Map<
    string,
    { date: string; items: { name: string; value: number }[] }
  >();

  for (const item of rawData) {
    if (item.value == null) continue;

    const timeCode = item.yearCode;
    const timeName = item.yearName?.replace("年度", "") || timeCode;

    if (!timeMap.has(timeCode)) {
      timeMap.set(timeCode, { date: timeName, items: [] });
    }
    timeMap.get(timeCode)!.items.push({
      name: item.categoryName,
      value: item.value,
    });
  }

  return Array.from(timeMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v);
}
