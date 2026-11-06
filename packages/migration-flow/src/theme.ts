/**
 * 移動フロー可視化のテーマ定数。
 * apps/remotion の brand.ts から必要分のみ抜粋（パッケージ自己完結のため）。
 */

import { CHART_THEMES } from "@stats47/types";

export const COLOR_SCHEMES = {
  light: {
    background: CHART_THEMES.light.paper,
    foreground: CHART_THEMES.light.ink,
    muted: CHART_THEMES.light.muted,
    accent: "#3B82F6",
    border: CHART_THEMES.light.wash,
    card: "#FFFFFF",
  },
  dark: {
    background: CHART_THEMES.dark.paper,
    foreground: CHART_THEMES.dark.ink,
    muted: CHART_THEMES.dark.muted,
    accent: "#60A5FA",
    border: CHART_THEMES.dark.line,
    card: CHART_THEMES.dark.wash,
  },
} as const;

export type ThemeName = keyof typeof COLOR_SCHEMES;
export type ColorScheme = (typeof COLOR_SCHEMES)[ThemeName];

export const FONT = {
  family: "'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif",
  weight: {
    regular: 400,
    medium: 500,
    bold: 700,
    black: 900,
  },
} as const;
