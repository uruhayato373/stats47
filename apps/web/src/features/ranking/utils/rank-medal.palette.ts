/**
 * 順位メダル (金・銀・銅) の識別パレット (見分けるための配色)。
 * 生の Tailwind パレット色は *.palette.ts にだけ置く (check-design-system: no-raw-palette-color)。
 */
export const RANK_MEDAL_BADGE = {
  1: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  2: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  3: "text-amber-700 bg-amber-700/10 border-amber-700/20",
} as const;

/** 1位 (金) の順位ラベル文字色 */
export const RANK_GOLD_TEXT = "text-amber-600" as const;
