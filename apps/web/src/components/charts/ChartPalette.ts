/**
 * Web app chart palette.
 *
 * Metric colours follow the same presentation metadata as their maps.
 * Generic series colours use CSS variables for light/dark theme tokens.
 */
import { resolveSchemeInterpolator } from "@stats47/visualization/d3";

import type { MetricPresentation } from "@stats47/types";

/** 指標の代表色は地図と同じ配色から取る。位置は全指標共通で、年度や値によって変えない。 */
const METRIC_COLOR_POSITION = 0.75;

export function getMetricChartColor(presentation: Pick<MetricPresentation, "colorScheme">): string {
  return resolveSchemeInterpolator(presentation.colorScheme)(METRIC_COLOR_POSITION);
}

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

const CHART_MUTED_COLOR = "hsl(var(--muted-foreground))";

export const FINANCE_CHART_COLORS = {
  revenue: CHART_COLORS[1],
  expenditure: CHART_COLORS[3],
  subtext: CHART_MUTED_COLOR,
} as const;

export const FLOW_CHART_COLORS = {
  inflow: CHART_COLORS[0],
  outflow: CHART_COLORS[3],
  subtext: CHART_MUTED_COLOR,
} as const;

/** 正負で塗り分けるチャート (増減の棒など) の色 */
export const DIVERGING_CHART_COLORS = {
  positive: "hsl(var(--positive))",
  negative: "hsl(var(--negative))",
} as const;

/** 系列の色が決まらないときの色 */
export const CHART_FALLBACK_COLOR = CHART_MUTED_COLOR;

export function getChartColor(index: number): string {
  return CHART_COLORS[((index % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];
}

export function getChartColors(count: number, startIndex = 0): string[] {
  return Array.from({ length: count }, (_, index) => getChartColor(startIndex + index));
}
