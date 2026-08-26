/**
 * Compatibility seam for theme-dashboard callers.
 *
 * Schema and parser live in data-configs so catalog validation and runtime
 * cannot interpret componentProps differently.
 */
export {
  parseThemeDbChartComponentProps,
  type CompositionChartComponentProps,
  type CpiChartComponentProps,
  type DonutChartComponentProps,
  type LineChartComponentProps,
  type MixedChartComponentProps,
  type ThemeDbChartComponentProps,
} from "@stats47/data-configs/theme-catalog";
