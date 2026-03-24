/**
 * CSS カスタムプロパティからテーマ色を取得するユーティリティ
 *
 * D3.js チャートはインペラティブに SVG を描画するため、
 * Tailwind の CSS クラスを直接使用できない。
 * 代わりに getComputedStyle で CSS 変数を読み取る。
 */

export interface ThemeColors {
  text: string;
  textMuted: string;
  border: string;
  background: string;
  muted: string;
}

export function getThemeColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  return {
    text: `hsl(${style.getPropertyValue("--foreground").trim()})`,
    textMuted: `hsl(${style.getPropertyValue("--muted-foreground").trim()})`,
    border: `hsl(${style.getPropertyValue("--border").trim()})`,
    background: `hsl(${style.getPropertyValue("--background").trim()})`,
    muted: `hsl(${style.getPropertyValue("--muted").trim()})`,
  };
}
