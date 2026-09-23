/**
 * WCAG 相対輝度・コントラスト比の計算ユーティリティ。
 *
 * IG シリーズトークン（tokens.ts）の配色が「32px 未満の文字は 4.5:1 以上、
 * 32px 以上の文字は 3:1 以上」を満たすことを __tests__/contrast.test.ts で機械検証するために使う。
 * 外部ライブラリは追加せず、WCAG 2.x の定義式をそのまま実装する。
 */

function srgbChannelToLinear(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** #RGB / #RRGGBB を 0-255 の [r,g,b] に変換する */
function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "").trim();
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`不正な hex color: ${hex}`);
  }
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return [r, g, b];
}

/** WCAG の相対輝度 (0=黒 〜 1=白) */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHexColor(hex);
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
}

/** 2色間のコントラスト比 (1:1 〜 21:1)。前景・背景の順序は問わない */
export function getContrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** プロジェクト規約: 32px 未満の文字に要求する最低コントラスト比 */
export const MIN_CONTRAST_SMALL_TEXT = 4.5;
/** プロジェクト規約: 32px 以上の文字に要求する最低コントラスト比 */
export const MIN_CONTRAST_LARGE_TEXT = 3.0;
