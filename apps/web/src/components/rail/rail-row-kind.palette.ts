/**
 * 右レールの行の種類 (テーマ・調査・ランキング) を見分ける四角の配色。
 * 生の Tailwind パレット色は *.palette.ts にだけ置く (check-design-system: no-raw-palette-color)。
 * 文字色は 700 (白地で 4.5:1 以上)、暗い地では 300 にする。
 */
export const RAIL_ROW_KIND_TONE = {
  theme: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  survey: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  ranking: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
} as const;

export type RailRowKind = keyof typeof RAIL_ROW_KIND_TONE;
