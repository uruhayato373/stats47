import type { PageComponent, LineChartData, MixedChartData } from "@/components/stat-charts";
import type { CompositionChartData } from "@/components/stat-charts/adapters/toCompositionChartData";

import {
  fetchDbChartDataAction,
  fetchPopulationPyramidAction,
  type CpiHeatmapItem,
  type CpiProfileItem,
  type DonutChartItem,
  type PopulationPyramidResult,
} from "../actions";

export type ThemeChartResult =
  | { type: "line"; data: LineChartData }
  | { type: "mixed"; data: MixedChartData }
  | { type: "composition"; data: CompositionChartData }
  | { type: "donut"; data: DonutChartItem[] }
  | { type: "cpi-profile"; data: CpiProfileItem[] }
  | { type: "cpi-heatmap"; data: CpiHeatmapItem[] }
  | { type: "pyramid"; data: PopulationPyramidResult }
  | null;

const DB_CHART_TYPES = new Set([
  "line-chart",
  "mixed-chart",
  "composition-chart",
  "donut-chart",
  "cpi-profile",
  "cpi-heatmap",
]);

export async function loadThemeChartResult(
  chart: PageComponent,
  prefCode: string,
): Promise<ThemeChartResult> {
  if (DB_CHART_TYPES.has(chart.componentType)) {
    return fetchDbChartDataAction(
      chart.componentType,
      chart.componentProps,
      prefCode,
    );
  }

  if (chart.componentType === "pyramid-chart") {
    const result = await fetchPopulationPyramidAction(prefCode);
    return result ? { type: "pyramid", data: result } : null;
  }

  return null;
}
