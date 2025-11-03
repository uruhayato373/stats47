/**
 * チャート用カラーパレット
 *
 * shadcn/ui テーマ色と連携したチャート用カラーの定義。
 * よく使われる色を一元管理し、保守性を向上させる。
 *
 * @module lib/chart-colors
 */

/**
 * 基本色パレット
 *
 * shadcn/ui テーマの --primary (221 83% 53%) と連携。
 * チャートでよく使われる色を定義。
 */
export const CHART_COLORS = {
  /** Blue（青色）- shadcn/ui primary 色と同期: hsl(221, 83%, 53%) */
  primary: "hsl(221, 83%, 53%)",
  /** Pink（ピンク色）- 出生数、死亡数、女性など */
  pink: "hsl(346, 77%, 50%)",
  /** Green（緑色）- 世帯構成、土地関連 */
  green: "hsl(142, 76%, 36%)",
  /** Orange（オレンジ色）- 土地関連 */
  orange: "hsl(38, 92%, 50%)",
  /** Purple（紫色）- 土地関連 */
  purple: "hsl(280, 70%, 50%)",
  /** Cyan（シアン色）- 土地関連 */
  cyan: "hsl(173, 80%, 40%)",
  /** Gray（灰色）- その他、データなし */
  gray: "hsl(0, 0%, 60%)",
  /** Dark Gray（ダークグレー）- 工業専用地域など */
  darkGray: "hsl(0, 0%, 40%)",
} as const;

/**
 * チャート用の意味的な色定義
 *
 * 用途別に色を定義し、チャート間で一貫性を保つ。
 */
export const SEMANTIC_CHART_COLORS = {
  /** 男性・出生数・転入など（積極的な意味） */
  male: CHART_COLORS.primary,
  birth: CHART_COLORS.primary,
  in: CHART_COLORS.primary,

  /** 女性・死亡数・転出など（対比的な意味） */
  female: CHART_COLORS.pink,
  death: CHART_COLORS.pink,
  out: CHART_COLORS.pink,

  /** その他の色（用途に応じて） */
  net: CHART_COLORS.green, // 転入超過数など
  other: CHART_COLORS.pink, // その他
} as const;

