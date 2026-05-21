/**
 * 移動フロー可視化のテーマ定数。
 * apps/remotion の brand.ts から必要分のみ抜粋（パッケージ自己完結のため）。
 */

export const COLOR_SCHEMES = {
  light: {
    background: "#FFFFFF",
    foreground: "#0F172A",
    muted: "#64748B",
    accent: "#3B82F6",
    border: "#E2E8F0",
    card: "#F8FAFC",
  },
  dark: {
    background: "#0F172A",
    foreground: "#F1F5F9",
    muted: "#94A3B8",
    accent: "#60A5FA",
    border: "#334155",
    card: "#1E293B",
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
