/**
 * SNS シェアボタンのブランド識別色（見分けるための配色）。
 * 意味を持つ状態色ではないため、生パレットはこのモジュールにだけ置く。
 */
export const SHARE_BRAND_PALETTE = {
  x: {
    hover: "hover:text-blue-400 hover:bg-blue-400/10",
    prominent: "bg-black text-white hover:bg-black/80",
  },
  facebook: {
    hover: "hover:text-blue-600 hover:bg-blue-600/10",
    prominent: "bg-[#1877F2] text-white hover:bg-[#1877F2]/90",
  },
  line: {
    hover: "hover:text-green-500 hover:bg-green-500/10",
    prominent: "bg-[#06C755] text-white hover:bg-[#06C755]/90",
  },
  hatena: {
    hover: "hover:text-blue-500 hover:bg-blue-500/10",
    prominent: "bg-[#00A4DE] text-white hover:bg-[#00A4DE]/90",
  },
} as const satisfies Record<string, { hover: string; prominent: string }>;
