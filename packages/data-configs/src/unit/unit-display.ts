/**
 * 単位を画面に出すときの表記をそろえる (表示専用。単位の意味の解釈は unit-semantics.ts)。
 *
 * e-Stat 由来の単位は全角のまま入っていて、「ｈａ」「ｋｇ」が 1 文字ずつ幅を取って「h a」「k g」と離れて見え、
 * 「％」と「%」、「m2」と「m²」がページごとに混在していた (2026-09-25 UI 全面点検 UNIT-NOTATION-FORMAT-01)。
 * 全角英数字と記号を半角に畳み (NFKC)、面積・体積の指数を上付きに戻す。値の換算はしない。
 */
export function formatUnitForDisplay(unit: string | null | undefined): string {
  if (!unit) return "";
  return unit
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/(k?m|c?m)([23])(?![0-9])/g, (_, base: string, power: string) => `${base}${power === "2" ? "²" : "³"}`);
}
