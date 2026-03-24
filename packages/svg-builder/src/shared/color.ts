/**
 * カラーパレット・スケールユーティリティ
 */

/** ブログチャート用の標準パレット */
export const PALETTES = {
  /** ワースト（多い・危険）→ 赤〜薄赤のグラデーション */
  red: [
    "#c62828", "#d32f2f", "#d32f2f", "#e53935",
    "#e53935", "#ef5350", "#ef5350", "#ef5350",
    "#e57373", "#ef9a9a",
  ],
  /** ベスト（少ない・安全）→ 濃青〜薄青のグラデーション */
  blue: [
    "#1565c0", "#1976d2", "#1e88e5", "#2196f3",
    "#42a5f5", "#64b5f6", "#90caf9", "#bbdefb",
    "#e3f2fd", "#f0f8ff",
  ],
  /** オレンジ（中立的に多い） */
  orange: [
    "#e65100", "#ef6c00", "#f57c00", "#fb8c00",
    "#ffa726", "#ffb74d", "#ffcc80", "#ffe0b2",
    "#fff3e0", "#fff8f0",
  ],
} as const;

export type PaletteName = keyof typeof PALETTES;

/** パレットからインデックスに対応する色を返す */
export function colorByIndex(palette: readonly string[], index: number): string {
  return palette[Math.min(index, palette.length - 1)] ?? palette[palette.length - 1];
}

/** 散布図のドット色（全県均一・相関把握用） */
export const SCATTER_COLORS = {
  mid: { fill: "#6b8fc9", stroke: "#3b6fa0" },
} as const;

/** フォント定義 */
export const FONT_FAMILY =
  "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif";
