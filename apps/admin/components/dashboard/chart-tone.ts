/** ダッシュボードのグラフ色。色はトークンのクラスで当てる (インライン style と var() 直書きを使わない) */
export type ChartTone = "good" | "warn" | "info" | "bad" | "neutral";

/** SVG の currentColor 用 (stroke="currentColor") */
export const CHART_TONE_TEXT: Record<ChartTone, string> = {
  good: "text-console-good",
  warn: "text-console-warn",
  info: "text-console-info",
  bad: "text-console-bad",
  neutral: "text-console-neutral",
};

/** SVG の塗り用 */
export const CHART_TONE_FILL: Record<ChartTone, string> = {
  good: "fill-console-good",
  warn: "fill-console-warn",
  info: "fill-console-info",
  bad: "fill-console-bad",
  neutral: "fill-console-neutral",
};
