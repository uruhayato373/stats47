/**
 * ブレイクポイント定数
 *
 * Tailwind CSSのデフォルトブレイクポイントに準拠
 * プロジェクト全体で統一されたブレイクポイント値を使用
 */
export const BREAKPOINTS = {
  sm: 640,   // 小型タブレット以上
  md: 768,   // タブレット以上
  lg: 1024,  // デスクトップ以上
  xl: 1280,  // 大画面以上
  '2xl': 1536, // 超大画面以上
} as const;

/**
 * メディアクエリ文字列
 *
 * useMediaQueryフックで使用するメディアクエリを定義
 */
export const MEDIA_QUERIES = {
  // 範囲指定
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,      // ～767px
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`, // 768px～1023px
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,         // 1024px～

  // 個別境界（下限）
  belowSm: `(max-width: ${BREAKPOINTS.sm - 1}px)`,    // ～639px
  belowMd: `(max-width: ${BREAKPOINTS.md - 1}px)`,    // ～767px
  belowLg: `(max-width: ${BREAKPOINTS.lg - 1}px)`,    // ～1023px
  belowXl: `(max-width: ${BREAKPOINTS.xl - 1}px)`,    // ～1279px
  below2xl: `(max-width: ${BREAKPOINTS['2xl'] - 1}px)`, // ～1535px

  // 個別境界（上限）
  aboveSm: `(min-width: ${BREAKPOINTS.sm}px)`,        // 640px～
  aboveMd: `(min-width: ${BREAKPOINTS.md}px)`,        // 768px～
  aboveLg: `(min-width: ${BREAKPOINTS.lg}px)`,        // 1024px～
  aboveXl: `(min-width: ${BREAKPOINTS.xl}px)`,        // 1280px～
  above2xl: `(min-width: ${BREAKPOINTS['2xl']}px)`,   // 1536px～
} as const;

export type MediaQueryKey = keyof typeof MEDIA_QUERIES;

