/**
 * Web app chart palette.
 *
 * Use CSS variables so charts follow light/dark theme tokens.
 */
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

export const CHART_MUTED_COLOR = "hsl(var(--muted-foreground))";

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

export function getChartColor(index: number): string {
  return CHART_COLORS[((index % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];
}

export function getChartColors(count: number, startIndex = 0): string[] {
  return Array.from({ length: count }, (_, index) => getChartColor(startIndex + index));
}
