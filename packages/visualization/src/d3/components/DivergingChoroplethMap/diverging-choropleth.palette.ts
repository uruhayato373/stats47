/**
 * 増減率コロプレス (RdBu 発散スケール) の方向ラベル色。
 *
 * 凡例グラデーションの両端 (減少=赤 / 増加=青) と揃えるための識別配色で、
 * 良い/悪いの意味トークン (positive=緑 / negative=赤) とは色相が合わないため
 * この palette module に集約する。
 */
export const DIVERGING_DIRECTION_TEXT_CLASS = {
  decrease: "text-red-600",
  increase: "text-blue-600",
} as const;
