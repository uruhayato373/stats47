import { CHART_COLORS } from "../constants";

import type { LineChartData } from "../types/visualization";
import type { StatsSchema } from "@stats47/types";

/**
 * e-Stat 生データを折れ線グラフ用に変換
 *
 * @param rawDataList - 各系列の e-Stat 生データ配列
 * @param seriesLabels - 系列ラベル配列（省略時は categoryName から導出）
 * @param seriesColors - 系列ごとの色指定配列（省略時は CHART_COLORS から自動割当）
 * @returns LineChartData
 */
export function toLineChartData(
  rawDataList: StatsSchema[][],
  seriesLabels?: string[],
  seriesColors?: string[]
): LineChartData {
  const labels =
    seriesLabels ?? rawDataList.map((d) => d[0]?.categoryName ?? "");
  const yearMap = new Map<string, Record<string, string | number>>();

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
      const row = yearMap.get(key)!;
      row[label] = item.value;
    });
  });

  const data = Array.from(yearMap.values()).sort((a, b) =>
    String(a.yearCode).localeCompare(String(b.yearCode))
  );

  return {
    xAxisKey: "year",
    data,
    lines: labels.map((label, i) => ({
      dataKey: label,
      name: label,
      color: seriesColors?.[i] ?? CHART_COLORS[i % CHART_COLORS.length],
    })),
    unit: rawDataList[0]?.[0]?.unit ?? undefined,
  };
}
