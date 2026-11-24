/**
 * 順位メダル (金) の識別パレット (見分けるための配色)。
 * 生の Tailwind パレット色は *.palette.ts にだけ置く (check-design-system: no-raw-palette-color)。
 */

/**
 * 1位 (金) の順位ラベル文字色。amber-600 は白地で 3.2:1 と小さい文字のコントラスト基準 (4.5:1) を満たさず、
 * axe の color-contrast になった (UI-FOLLOWUP-02)。700 は白地で約 5:1。暗い地では 400 にする。
 */
export const RANK_GOLD_TEXT = "text-amber-700 dark:text-amber-400" as const;
