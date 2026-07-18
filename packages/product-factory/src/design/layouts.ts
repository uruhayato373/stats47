/**
 * レイアウト寸法。用途別に固定する (16:9 / A4 横 / A4 縦 / ココナラ サムネ 620×620)。
 * inch は PowerPoint (EMU 換算元)、px は SVG/PNG viewBox 用。
 */
export interface LayoutDim {
  readonly id: string;
  readonly name: string;
  readonly wInch: number;
  readonly hInch: number;
  readonly wPx: number;
  readonly hPx: number;
}

export const LAYOUTS = {
  "16x9": { id: "16x9", name: "16:9 スライド", wInch: 13.333, hInch: 7.5, wPx: 1280, hPx: 720 },
  "a4-landscape": { id: "a4-landscape", name: "A4 横", wInch: 11.69, hInch: 8.27, wPx: 1123, hPx: 794 },
  "a4-portrait": { id: "a4-portrait", name: "A4 縦", wInch: 8.27, hInch: 11.69, wPx: 794, hPx: 1123 },
  "thumb-square": { id: "thumb-square", name: "ココナラ サムネ 620×620", wInch: 6.458, hInch: 6.458, wPx: 620, hPx: 620 },
} satisfies Record<string, LayoutDim>;

export type LayoutId = keyof typeof LAYOUTS;
