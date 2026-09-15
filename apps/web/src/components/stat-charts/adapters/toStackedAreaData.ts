import { CHART_COLORS } from "../constants";

import { resolveChartUnit } from "./resolve-chart-unit";

import type { StatsSchema } from "@stats47/types";
import type { StackedAreaSeriesConfig } from "@stats47/visualization/d3";

export interface StackedAreaData {
  categoryKey: string;
  data: Array<Record<string, string | number>>;
  series: StackedAreaSeriesConfig[];
  unit?: string;
}

export function toStackedAreaData(
  rawDataList: StatsSchema[][],
  seriesLabels?: string[],
  unit?: string,
): StackedAreaData {
  const labels = seriesLabels ?? rawDataList.map(() => "");
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
      row[label] = item.value ?? 0;
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
    unit: resolveChartUnit(unit, rawDataList),
  };
}
