import { parseUnit, scalePrefixMultiplier } from "./unit-semantics";

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

/**
 * 文章 (AI 解説・FAQ などの生成文) の中で、数字の直後に付いた全角「％」だけを半角「%」にそろえる。
 * 同じページの表やカードは formatUnitForDisplay で「%」に畳むため、本文だけ「％」だと混在して見える
 * (2026-10-04 週次 UI 検査 unit_symbol_mixing)。R2 の生成文は書き換えず、表示時だけ整える。
 * 数字に続かない「％」(「％表示」等の語) と、ほかの全角文字は変えない。
 */
export function normalizePercentInText(text: string): string {
  return text.replace(/(\d)\s*％/g, "$1%");
}

/** 万・億・兆で桁を寄せてよい次元。面積 (ha→m²) や質量 (t→g) は基底単位で書くと読みにくくなるので寄せない。 */
const JAPANESE_MAGNITUDE_DIMENSIONS = new Set(["currency", "people", "household", "count"]);
/** 大きい順。倍率は単位の正典 (scalePrefixMultiplier) から引く。 */
const JAPANESE_MAGNITUDE_PREFIXES = ["兆", "億", "万"] as const;

function formatPlainNumber(value: number): string {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

/**
 * 値を「4.9万人」「20.5兆円」のように、万・億・兆で読める桁へ寄せて書く (title や説明文の短い数値用)。
 * 単位の倍率 (百万円 = 10^6 円) を正典で解き、基底単位の値から一番大きく収まる接頭辞を選ぶ。
 * 分母つき・割合・指数・解釈できない単位は、接頭辞を付けると意味が変わるので桁区切りのまま返す。
 */
export function formatReadableMagnitude(value: number, unit: string | null | undefined): string {
  const parsed = parseUnit(unit);
  if (
    parsed.dimension === null ||
    parsed.hasDenominator ||
    !parsed.baseUnit ||
    !JAPANESE_MAGNITUDE_DIMENSIONS.has(parsed.dimension)
  ) {
    return `${formatPlainNumber(value)}${formatUnitForDisplay(unit)}`;
  }
  const base = value * 10 ** parsed.scaleExponent;
  for (const prefix of JAPANESE_MAGNITUDE_PREFIXES) {
    const multiplier = scalePrefixMultiplier(prefix);
    if (multiplier === null || Math.abs(base) < multiplier) continue;
    const scaled = base / multiplier;
    const digits = Math.abs(scaled) >= 100 ? 0 : 1;
    return `${scaled.toLocaleString("ja-JP", { maximumFractionDigits: digits })}${prefix}${parsed.baseUnit}`;
  }
  return `${formatPlainNumber(base)}${parsed.baseUnit}`;
}
