/**
 * ランキングの地域の単位の切り替え (RankingAreaUnitSwitch) で、押せる側 (相手のページ) に付ける配色。
 * 灰色の文字のままでは見落とされ、相手のページへの回遊が減る (2026-11-26 オーナー判断で青にする)。
 * 生の Tailwind パレット色は *.palette.ts にだけ置く (check-design-system: no-raw-palette-color)。
 * 白い文字は blue-600 の上で約 5.2:1 (小さい文字の基準 4.5:1 を満たす)。暗い地でも同じ地の色にする。
 */
export const AREA_UNIT_SWITCH_LINK_TONE =
  "bg-blue-600 text-white hover:bg-blue-700 hover:text-white dark:hover:bg-blue-700" as const;
