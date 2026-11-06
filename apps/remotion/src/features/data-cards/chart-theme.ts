import type { ChartTheme } from '@stats47/types';

export { CHART_THEMES, LIGHT_THEME, type ChartTheme } from '@stats47/types';

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
