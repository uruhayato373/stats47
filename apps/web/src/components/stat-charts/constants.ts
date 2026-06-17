/**
 * チャートカラーパレット（CSS 変数参照）
 * 5 色を循環で使用する。tailwind.config.ts の --chart-1 〜 --chart-5 に対応。
 */
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

/** インデックスからカラーを取得（循環） */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
