import type { PageComponent } from "@/components/stat-charts";

import {
  fetchDbChartDataAction,
  fetchPopulationPyramidAction,
  type PopulationPyramidResult,
  type ThemeDbChartResult,
} from "../actions";

export type ThemeChartResult =
  | NonNullable<ThemeDbChartResult>
  | {
      type: "pyramid";
      data: PopulationPyramidResult;
      contract: { unit: string; year: string; seriesCount: number };
    };

export type ThemeChartLoadResult =
  { state: "ready"; result: ThemeChartResult } | { state: "no-data" } | { state: "source-unavailable" };

const DB_CHART_TYPES = new Set([
  "line-chart",
  "mixed-chart",
  "composition-chart",
  "donut-chart",
  "cpi-profile",
  "cpi-heatmap",
]);

export async function loadThemeChartResult(chart: PageComponent, prefCode: string): Promise<ThemeChartLoadResult> {
  try {
    if (DB_CHART_TYPES.has(chart.componentType)) {
      const result = await fetchDbChartDataAction(chart.componentType, chart.componentProps, prefCode);
      return result ? { state: "ready", result } : { state: "no-data" };
    }

    if (chart.componentType === "pyramid-chart") {
      const data = await fetchPopulationPyramidAction(prefCode);
      return data
        ? {
            state: "ready",
            result: {
              type: "pyramid",
              data,
              contract: {
                unit: "人",
                year: data.yearName,
                seriesCount: data.pyramidData.length,
              },
            },
          }
        : { state: "no-data" };
    }

    return { state: "no-data" };
  } catch {
    return { state: "source-unavailable" };
  }
}
