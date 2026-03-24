/**
 * stats47 ブランド定義・デザイントークン
 *
 * 画像・動画生成で使用する共通のカラー・フォント・サイズ定数。
 * Remotion コンポーネントは CSS-in-JS（inline style）で描画するため、
 * Tailwind ではなくこの定数を参照する。
 */

// ---------------------------------------------------------------------------
// カラースキーム
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ブランドカラー（テーマ非依存）
// ---------------------------------------------------------------------------

export const BRAND = {
  primary: "#1E40AF",
  primaryLight: "#3B82F6",
  secondary: "#F59E0B",
  success: "#10B981",
  danger: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
} as const;

/** 順位別カラー（1-3位のグラデーション用） */
export const RANK_COLORS = {
  1: { from: "#FFD700", to: "#F59E0B" },  // 金
  2: { from: "#C0C0C0", to: "#94A3B8" },  // 銀
  3: { from: "#CD7F32", to: "#A0522D" },  // 銅
} as const;

// ---------------------------------------------------------------------------
// タイポグラフィ
// ---------------------------------------------------------------------------

export const FONT = {
  family: "'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif",
  familyMono: "'JetBrains Mono', 'Fira Code', monospace",
  weight: {
    regular: 400,
    medium: 500,
    bold: 700,
    black: 900,
  },
} as const;

// ---------------------------------------------------------------------------
// キャンバスサイズ（ピクセル）
// ---------------------------------------------------------------------------

export const CANVAS = {
  /** リール / SNSカード (9:16) */
  portrait: { width: 1080, height: 1920 },
  /** OGP (約1.91:1) */
  ogp: { width: 1200, height: 630 },
  /** YouTubeサムネイル (16:9) */
  youtube: { width: 1280, height: 720 },
  /** YouTube 通常動画 (16:9 Full HD) */
  youtube16x9: { width: 1920, height: 1080 },
  /** カルーセル (4:5) */
  carousel: { width: 1080, height: 1350 },
  /** 正方形 (1:1) */
  square: { width: 1080, height: 1080 },
  /** サムネイル */
  thumbnail: { width: 240, height: 240 },
  /** note カバー画像 */
  noteCover: { width: 1280, height: 670 },
  /** X (Twitter) 投稿画像 */
  xPost: { width: 1200, height: 675 },
} as const;

export type CanvasPreset = keyof typeof CANVAS;

// ---------------------------------------------------------------------------
// スペーシング・角丸
// ---------------------------------------------------------------------------

export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
