/**
 * SNS シェアボタンのブランド識別色（見分けるための配色）。
 * 意味を持つ状態色ではないため、生パレットはこのモジュールにだけ置く。
 *
 * LINE とはてなの地色は明るく、白文字では 4.5:1 に届かない (2.26 / 2.85)。ブランドの地色は変えず、
 * 文字を濃紺にする (7.91 / 6.26。2026-10-06 axe color-contrast)。
 * simple 版はテンプレートの Button (outline) の hover をそのまま使うので、ブランド色の hover は持たない
 * (旧 hover は読み手 0 件のため 2026-10-28 に削除)。
 *
 * prominent 版は Button (variant="default") の className に渡す。Button の lyra (bg-primary 等) は
 * 呼び出し側の className より後ろで合成されて勝つので、ブランド色には ! を付ける (packages/ui-theme/README.md)。
 */
export const SHARE_BRAND_PALETTE = {
  x: {
    prominent: "bg-black! text-white! hover:bg-black/80!",
  },
  facebook: {
    prominent: "bg-[#1877F2]! text-white! hover:bg-[#1877F2]/90!",
  },
  line: {
    prominent: "bg-[#06C755]! text-[#0f172a]! hover:bg-[#06C755]/90!",
  },
  hatena: {
    prominent: "bg-[#00A4DE]! text-[#0f172a]! hover:bg-[#00A4DE]/90!",
  },
} as const satisfies Record<string, { prominent: string }>;
