/**
 * 男女ペア KPI の識別パレット (見分けるための配色)。
 * 生の Tailwind パレット色は *.palette.ts にだけ置く (check-design-system: no-raw-palette-color)。
 */
export const GENDER_TONE_TEXT = {
  male: "text-blue-700 dark:text-blue-400",
  female: "text-pink-700 dark:text-pink-400",
} as const;

export type GenderTone = keyof typeof GENDER_TONE_TEXT;
