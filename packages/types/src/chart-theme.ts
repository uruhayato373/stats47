/**
 * Paper, text and line colours of every statistical image and video, light and dark. Data colours (tiles,
 * bars, map fills) come from the metric's scheme and do not change with the theme.
 *
 * The dark theme sits on the site's dark page (#0A0A0A): a lighter grey paper and light grey outlines
 * on prefecture borders, tiles, legend swatches and bar rows keep the shapes apart from the page.
 */
export interface ChartTheme {
  name: 'light' | 'dark';
  paper: string;
  ink: string;
  muted: string;
  /** Bar tracks and other quiet fills. */
  wash: string;
  /** Rules that separate (e.g. the Okinawa rule). */
  line: string;
  /** Prefecture borders on the real-shape map. */
  mapBorder: string;
  /** Edge of tiles, legend swatches and bar rows; none in the light theme. */
  outline?: string;
}

// Light values are the brand paper/ink (apps/web/src/features/ogp/brand.ts BRAND).
export const CHART_THEMES: Record<ChartTheme['name'], ChartTheme> = {
  light: { name: 'light', paper: '#F8FAFC', ink: '#18283C', muted: '#475569', wash: '#E2E8F0', line: '#CBD5E1', mapBorder: '#FFFFFF' },
  dark: { name: 'dark', paper: '#262626', ink: '#F5F5F5', muted: '#B5B5B5', wash: '#363636', line: '#525252', mapBorder: '#8A8A8A', outline: '#8A8A8A' },
};
export const LIGHT_THEME = CHART_THEMES.light;
