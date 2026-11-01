import { CHART_COLORS } from "../constants";

import { resolveChartUnit } from "./resolve-chart-unit";

import type { LineChartData } from "../types/visualization";
import type { StatsSchema } from "@stats47/types";

export function toLineChartData(
  rawDataList: StatsSchema[][],
  seriesLabels?: string[],
  seriesColors?: string[],
  unit?: string,
): LineChartData {
  const labels = seriesLabels ?? rawDataList.map(() => "");
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
      if (typeof item.value === "number" && Number.isFinite(item.value)) row[label] = item.value;
    });
  });

  const data = Array.from(yearMap.values()).sort((a, b) =>
    String(a.yearCode).localeCompare(String(b.yearCode))
  );

  // 値が 1 つも無い系列は線も凡例も出さない (色は元の並び順で決める)。
  // 2026-10-30: 全国の値が R2 に無い「充足率」が、線の無いまま凡例にだけ出ていた
  const hasValue = (label: string) => data.some((row) => typeof row[label] === "number");
  return {
    xAxisKey: "year",
    data,
    lines: labels.flatMap((label, i) =>
      hasValue(label)
        ? [{ dataKey: label, name: label, color: seriesColors?.[i] ?? CHART_COLORS[i % CHART_COLORS.length] }]
        : []
    ),
    unit: resolveChartUnit(unit, rawDataList),
  };
}
