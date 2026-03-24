/**
 * チャート色定義
 *
 * 全チャートコンポーネントで使用する共通カラーパレット。
 */

/**
 * デフォルトのチャートカラーパレット
 */
export const CHART_COLORS = [
  "hsl(221, 83%, 53%)",  // 青
  "hsl(340, 82%, 52%)",  // ピンク
  "hsl(142, 76%, 36%)",  // 緑
  "hsl(25, 95%, 53%)",   // オレンジ
  "hsl(280, 65%, 60%)",  // 紫
  "hsl(45, 93%, 47%)",   // 黄
  "hsl(195, 74%, 44%)",  // シアン
  "hsl(0, 72%, 51%)",    // 赤
] as const;

/**
 * 性別用カラー
 */
export const GENDER_COLORS = {
  male: "hsl(221, 83%, 53%)",
  female: "hsl(340, 82%, 52%)",
} as const;

/**
 * 増減用カラー
 */
export const CHANGE_COLORS = {
  increase: "hsl(142, 76%, 36%)",
  decrease: "hsl(0, 72%, 51%)",
  neutral: "hsl(0, 0%, 50%)",
} as const;

/**
 * 色を取得（配列インデックスでループ）
 * 負のインデックスも正しく処理する
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[((index % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];
}
