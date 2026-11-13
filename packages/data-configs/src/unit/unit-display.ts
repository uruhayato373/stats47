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
 * 文章 (AI 解説・FAQ・記事の本文や題・注記) の中で、数字の直後に付いた単位の表記を、表やカードと同じ書き方にそろえる。
 * 同じページの表やカードは formatUnitForDisplay で「%」「ha」「km²」と書くため、本文だけ「％」「ｈａ」「km2」だと混在して見える
 * (2026-10-04 週次 UI 検査 unit_symbol_mixing。2026-11-14 に ％ だけでなく全角の英字の単位と面積・体積の指数へ広げた)。
 * R2 の生成文や記事の原稿は書き換えず、表示時だけ整える。
 *
 * 変えるのは数字の直後 (千・万などの接頭辞をはさんでもよい) だけ: 全角の ％ → %、全角の英字 → 半角、m2・km2・m3 → m²・km²・m³。
 * 数字に続かない全角文字 (「％表示」「ＧＤＰ」「総面積km2当たり」)、全角の数字・括弧・句読点は変えない。
 */
export function normalizeUnitsInText(text: string): string {
  return text
    .replace(/(\d)\s*％/g, "$1%")
    .replace(/(\d\s*[百千万億]*)([ａ-ｚＡ-Ｚ]+)/g, (_, head: string, letters: string) => `${head}${letters.normalize("NFKC")}`)
    .replace(/(\d\s*[百千万億]*(?:k|c)?m)([23])(?![0-9A-Za-z])/g, (_, head: string, power: string) => `${head}${power === "2" ? "²" : "³"}`);
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
