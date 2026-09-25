/**
 * 相関係数の強さを示す発散スケール (正=赤系 / 負=青系)。
 *
 * 意味 (良い/悪い) ではなく「相関の向きと強さ」を見分けるための識別配色なので、
 * 意味トークンに寄せずこの palette module に集約する。
 * 12px の数値なので WCAG AA (4.5:1) を満たす 700 番台を使う (500 番台は白地で 2.4〜3.8:1)。
 */
export const CORRELATION_STRENGTH_CLASS = {
  strongPositive: "text-red-700 dark:text-red-400",
  moderatePositive: "text-orange-700 dark:text-orange-400",
  strongNegative: "text-blue-700 dark:text-blue-400",
  moderateNegative: "text-cyan-700 dark:text-cyan-400",
} as const;
