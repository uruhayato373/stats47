/**
 * Paper, text and line colours of the 4:5 statistical images, light and dark. Data colours (tiles,
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

/** `stroke` attributes for an outlined shape, or nothing in a theme without outlines. */
export const outlineAttrs = (theme: ChartTheme, width = 2) =>
  theme.outline ? ` stroke="${theme.outline}" stroke-width="${width}"` : '';

const channels = (color: string) => {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  return hex ? hex.slice(1).map((h) => parseInt(h, 16)) : (color.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
};
/** `color` moved toward `to` by `t` (0–1), as `#rrggbb`; accepts `#rrggbb` and `rgb(r, g, b)`. */
export function mixColor(color: string, to: string, t: number) {
  const a = channels(color), b = channels(to);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
/** `#rrggbb` form of an `#rrggbb` or `rgb(r, g, b)` colour (d3 interpolators return the latter). */
export const toHex = (color: string) => mixColor(color, color, 0);
