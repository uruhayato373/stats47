import type { StatsSchema } from "@stats47/types";
import type { StackedAreaSeriesConfig } from "@stats47/visualization/d3";
import { CHART_COLORS } from "../constants";

export interface StackedAreaData {
  categoryKey: string;
  data: Array<Record<string, string | number>>;
  series: StackedAreaSeriesConfig[];
  unit?: string;
}

/**
 * e-Stat 生データを積み上げ面グラフ用に変換
 *
 * @param rawDataList - 各系列の e-Stat 生データ配列
 * @param seriesLabels - 系列ラベル配列（省略時は categoryName から導出）
 * @returns StackedAreaData
 */
export function toStackedAreaData(
  rawDataList: StatsSchema[][],
  seriesLabels?: string[]
): StackedAreaData {
  const labels =
    seriesLabels ?? rawDataList.map((d) => d[0]?.categoryName ?? "");
  const yearMap = new Map<string, Record<string, string | number>>();

  labels.forEach((label, idx) => {
    const rawData = rawDataList[idx] ?? [];
    rawData.forEach((item) => {
      const key = item.yearCode;
      if (!yearMap.has(key)) {
        yearMap.set(key, {
          category: item.yearCode,
          label: item.yearName || item.yearCode,
        });
      }
      const row = yearMap.get(key)!;
      row[label] = item.value;
    });
  });

  const data = Array.from(yearMap.values()).sort((a, b) =>
    String(a.category).localeCompare(String(b.category))
  );

  return {
    categoryKey: "category",
    data,
    series: labels.map((label, i) => ({
      key: label,
      label,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    unit: rawDataList[0]?.[0]?.unit ?? undefined,
  };
}
