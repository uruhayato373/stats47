import { parseStatSeriesRefs } from "@stats47/data-configs/theme-catalog";

import type { PageComponent } from "@/components/stat-charts";

import {
  fetchDbChartDataAction,
  fetchPopulationPyramidAction,
  type PopulationPyramidResult,
  type ThemeDbChartResult,
} from "../actions";
import { NATIONAL_AREA_CODE } from "../lib/select-national-series";

export type ThemeChartResult =
  | NonNullable<ThemeDbChartResult>
  | {
      type: "pyramid";
      data: PopulationPyramidResult;
      contract: { unit: string; year: string; seriesCount: number };
    };

export type ThemeChartLoadResult =
  | { state: "ready"; result: ThemeChartResult }
  | { state: "no-data"; message?: string }
  | { state: "source-unavailable" };

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
      if (
        prefCode === NATIONAL_AREA_CODE &&
        (chart.componentType === "cpi-profile" || chart.componentType === "cpi-heatmap")
      ) {
        return {
          state: "no-data",
          message: "全国平均を100とする指数のため、全国表示には対応していません。都道府県を選択してください。",
        };
      }
      const result = await fetchDbChartDataAction(chart.componentType, chart.componentProps, prefCode);
      return result ? { state: "ready", result } : { state: "no-data" };
    }

    if (chart.componentType === "pyramid-chart") {
      const seriesRefs = parseStatSeriesRefs(chart.componentProps.seriesRefs);
      if (!seriesRefs) return { state: "no-data" };
      const data = await fetchPopulationPyramidAction(prefCode, seriesRefs);
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
