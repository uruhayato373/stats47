import type { StatsSchema } from "@stats47/types";
import { CHART_COLORS } from "../constants";
import type { MixedChartData } from "../types/visualization";

/**
 * e-Stat 生データを棒+折れ線ミックスチャート用に変換
 *
 * @param columnColors - 棒系列の色指定（省略時は CHART_COLORS から自動割当）
 * @param lineColors - 線系列の色指定（省略時は CHART_COLORS から自動割当）
 */
export function toMixedChartData(
  columnDataList: StatsSchema[][],
  lineDataList: StatsSchema[][],
  columnLabels?: string[],
  lineLabels?: string[],
  leftUnit?: string,
  rightUnit?: string,
  columnColors?: string[],
  lineColors?: string[]
): MixedChartData {
  const colLabels =
    columnLabels ?? columnDataList.map((d) => d[0]?.categoryName ?? "");
  const linLabels =
    lineLabels ?? lineDataList.map((d) => d[0]?.categoryName ?? "");

  const yearMap = new Map<string, Record<string, string | number>>();

  const addToMap = (rawDataList: StatsSchema[][], labels: string[]) => {
    labels.forEach((label, idx) => {
      const rawData = rawDataList[idx] ?? [];
      rawData.forEach((item) => {
        const key = item.yearCode;
        if (!yearMap.has(key)) {
          yearMap.set(key, {
            year: item.yearName || item.yearCode,
            yearCode: item.yearCode,
          });
        }
        yearMap.get(key)![label] = item.value;
      });
    });
  };

  addToMap(columnDataList, colLabels);
  addToMap(lineDataList, linLabels);

  const data = Array.from(yearMap.values()).sort((a, b) =>
    String(a.yearCode).localeCompare(String(b.yearCode))
  );

  return {
    xAxisKey: "year",
    data,
    columns: colLabels.map((label, i) => ({
      dataKey: label,
      name: label,
      color: columnColors?.[i] ?? CHART_COLORS[i % CHART_COLORS.length],
    })),
    lines: linLabels.map((label, i) => ({
      dataKey: label,
      name: label,
      color: lineColors?.[i] ?? CHART_COLORS[(colLabels.length + i) % CHART_COLORS.length],
    })),
    leftUnit,
    rightUnit,
  };
}
