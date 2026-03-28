import { extractYearsFromStats } from "@stats47/estat-api/server";

import { CHART_COLORS } from "../constants";

import type { BarChartData } from "../types/visualization";
import type { StatsSchema } from "@stats47/types";

/**
 * e-Stat 生データを棒グラフ用に変換（統一関数）
 *
 * @param rawDataList - 各系列の e-Stat 生データ配列
 * @param seriesLabels - 系列ラベル配列（省略時は categoryName から導出）
 * @param chartType - グラフ種別（"bar": 最新値のみ、"stacked-bar": 時系列）
 * @returns BarChartData
 */
export function toBarChartData(
  rawDataList: StatsSchema[][],
  seriesLabels?: string[],
  chartType: "bar" | "stacked-bar" | "grouped" = "stacked-bar"
): BarChartData {
  const labels =
    seriesLabels ?? rawDataList.map((d) => d[0]?.categoryName ?? "");
  if (chartType === "bar") {
    return toSimpleBarChartData(rawDataList, labels);
  }
  // "stacked-bar" and "grouped" use the same data structure (series per year)
  return toStackedBarChartData(rawDataList, labels);
}

/**
 * 時系列データを積み上げ棒グラフ用に変換
 */
export function toStackedBarChartData(
  rawDataList: StatsSchema[][],
  seriesLabels: string[]
): BarChartData {
  const yearMap = new Map<string, Record<string, string | number>>();

  seriesLabels.forEach((label, idx) => {
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
      row[label] = ((row[label] as number) ?? 0) + item.value;
    });
  });

  const data = Array.from(yearMap.values()).sort((a, b) =>
    String(a.yearCode).localeCompare(String(b.yearCode))
  );

  return {
    categoryKey: "year",
    data,
    series: seriesLabels.map((label, i) => ({
      dataKey: label,
      name: label,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    unit: rawDataList[0]?.[0]?.unit ?? undefined,
  };
}

/**
 * 最新値のみを棒グラフ用に変換
 */
export function toSimpleBarChartData(
  rawDataList: StatsSchema[][],
  seriesLabels: string[]
): BarChartData {
  const data = seriesLabels
    .map((label, index) => {
      const rawData = rawDataList[index] ?? [];
      if (rawData.length === 0) return null;

      const years = extractYearsFromStats(rawData);
      if (years.length === 0) return null;

      const latestYear = years[0];
      const item = rawData.find((d) => d.yearCode === latestYear.yearCode);
      if (!item) return null;

      return {
        name: label,
        value: item.value,
        unit: item.unit ?? "",
        date: latestYear.yearName || latestYear.yearCode,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  return {
    categoryKey: "name",
    data,
    series: seriesLabels.map((label, i) => ({
      dataKey: "value",
      name: label,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    unit: data[0]?.unit,
  };
}
