/**
 * アフィリエイト vertical の識別パレット (見分けるための配色)。
 * 生の Tailwind パレット色は *.palette.ts にだけ置く (check-design-system: no-raw-palette-color)。
 */
import type { AffiliateVertical } from "./affiliate-category";

/** カテゴリ別テーマカラー（Tailwind クラス: border / bg / icon） */
export const AFFILIATE_THEME: Record<
  AffiliateVertical,
  { border: string; bg: string; icon: string; emoji: string }
> = {
  labor:      { border: "border-blue-100",   bg: "bg-blue-50/50",   icon: "text-blue-400",   emoji: "💼" },
  housing:    { border: "border-orange-100", bg: "bg-orange-50/50", icon: "text-orange-400", emoji: "🏠" },
  population: { border: "border-pink-100",   bg: "bg-pink-50/50",   icon: "text-pink-400",   emoji: "💑" },
  economy:    { border: "border-green-100",  bg: "bg-green-50/50",  icon: "text-green-500",  emoji: "💰" },
  health:     { border: "border-teal-100",   bg: "bg-teal-50/50",   icon: "text-teal-500",   emoji: "💪" },
  energy:     { border: "border-cyan-100",   bg: "bg-cyan-50/50",   icon: "text-cyan-500",   emoji: "💧" },
  travel:     { border: "border-amber-100",  bg: "bg-amber-50/50",  icon: "text-amber-500",  emoji: "✈️" },
  furusato:   { border: "border-red-100",    bg: "bg-red-50/50",    icon: "text-red-400",    emoji: "🎁" },
  education:  { border: "border-indigo-100", bg: "bg-indigo-50/50", icon: "text-indigo-400", emoji: "📚" },
  mobility:   { border: "border-slate-200",  bg: "bg-slate-50/50",  icon: "text-slate-500",  emoji: "🚗" },
};
