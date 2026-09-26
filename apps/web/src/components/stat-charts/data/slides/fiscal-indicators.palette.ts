/**
 * 財政健全化スライドの識別配色。
 *
 * スライドごとのアクセント色と「4つの健全化判断比率」のアイコン色は、
 * 意味 (良い/悪い) ではなく「どのスライド・どの指標か」を見分けるための色なので
 * 意味トークンに寄せず、この palette module に集約する。
 */
export const FISCAL_SLIDE_ACCENT = {
  introduction: "bg-blue-600",
  indicators: "bg-indigo-600",
  thresholds: "bg-red-600",
  publicEnterprises: "bg-cyan-600",
  process: "bg-slate-800",
} as const;

export const FISCAL_INDICATOR_ICON_COLOR = {
  realDeficit: "text-red-500",
  consolidatedDeficit: "text-orange-500",
  debtService: "text-blue-500",
  futureBurden: "text-purple-500",
} as const;

/** 公営企業スライドの指標カード (スライドアクセントと同系色で塗る) */
export const FISCAL_PUBLIC_ENTERPRISE_CARD = {
  surface: "bg-cyan-600 text-white",
  divider: "border-cyan-500/50",
} as const;
