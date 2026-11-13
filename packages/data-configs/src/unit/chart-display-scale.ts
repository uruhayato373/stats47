import { parseUnit, scalePrefixMultiplier } from "./unit-semantics";
import { formatUnitForDisplay } from "./unit-display";

/**
 * 図 1 枚の表示用の単位を、データの単位と値から決める (2026-11-03 オーナー指示)。
 *
 * 「1,544,976,077千円」のように桁が多いと、地図のタイルや凡例の数字が潰れて読めない。図の中の値は
 * すべて同じ単位で並べたいので、値ごとではなく**図ごとに 1 つ**の単位を選ぶ (値ごとに寄せる
 * `formatReadableMagnitude` は見出しや文中の 1 つの値用)。
 *
 * 決め方 (全 2,425 指標の最新年で実測して決めた。`data/metrics/display-units/ledger.json`):
 * 1. 量の次元 (金額・人数・世帯・件数・戸数・重さ・面積・体積・電力・エネルギー・船の総トン数) だけを寄せる。
 *    割合・指数・分母つき・時間・長さ・温度は寄せない。単位を解釈できないものも寄せない
 *    (1 倍で済ませず、そのままの単位で出す)。
 * 2. 単位の先頭の数の接頭辞 (千・百万…) を外した語 (円・人・トン・ha…) に、万・億・兆を付け直す。
 *    重さや面積を g・m² のような基本の単位には戻さない (「万トン」「万ha」と読む)。
 * 3. 最大値の絶対値が 5 桁以内に収まり、0 でない最小の県が 0 に丸まらない、いちばん小さい接頭辞を選ぶ。
 *    5 桁に収めると 0 に見える県が出るときは 6 桁まで許す。
 * 4. 寄せるのは、最大値が 6 桁以上のときと、単位が万の区切りから外れているとき (千円・百万円・千人) だけ。
 */
export interface ChartDisplayScale {
  /** 図に書く単位 (「億円」「万人」「ha」)。 */
  unit: string;
  /** 元の値に掛けて表示の値にする倍率。寄せないときは 1。 */
  factor: number;
  /** 表示の小数桁。寄せないときは null (呼び出し側がデータの桁で決める)。 */
  decimals: number | null;
  reason: "rescaled" | "small" | "not-quantity" | "unparsed" | "no-values";
}

/** 桁を寄せてよい「量」の次元。parseUnit の dimension 名。 */
export const CHART_QUANTITY_DIMENSIONS: ReadonlySet<string> = new Set([
  "currency", "people", "household", "count", "dwelling", "mass", "area", "volume", "power", "energy", "gross-tonnage",
]);
/** 付け直す接頭辞。小さい順に試す。 */
const CHART_PREFIXES = ["", "万", "億", "兆"] as const;
const MAN_SERIES = new Set(["万", "億", "兆"]);
/** 表示の最大値の上限 (5 桁)。0 に見える県が出るときだけ 6 桁まで。 */
const MAX_SHOWN = 100_000;
const MAX_SHOWN_FALLBACK = 1_000_000;
/** 表示の最大値がこれ以上なら整数、未満なら小数 1 桁。 */
const INTEGER_FROM = 1_000;

/** 単位の先頭の数の接頭辞と、残りの語。「千円」→ 千 / 円。接頭辞を外すと次元が変わる語は外さない。 */
function splitNumericPrefix(unit: string): { prefix: string; word: string; multiplier: number } {
  const dimension = parseUnit(unit).dimension;
  for (const length of [2, 1]) {
    const prefix = unit.slice(0, length), word = unit.slice(length);
    const multiplier = scalePrefixMultiplier(prefix);
    if (multiplier !== null && word && parseUnit(word).dimension === dimension) return { prefix, word, multiplier };
  }
  return { prefix: "", word: unit, multiplier: 1 };
}

export function resolveChartDisplayScale(unit: string | null | undefined, values: readonly number[]): ChartDisplayScale {
  const raw = (unit ?? "").normalize("NFKC").trim();
  const keep = (reason: ChartDisplayScale["reason"]): ChartDisplayScale => ({ unit: formatUnitForDisplay(raw), factor: 1, decimals: null, reason });
  const nonZero = values.filter((v) => Number.isFinite(v) && v !== 0).map(Math.abs);
  if (!nonZero.length) return keep("no-values");
  const parsed = parseUnit(raw);
  if (parsed.dimension === null) return keep("unparsed");
  if (parsed.hasDenominator || !CHART_QUANTITY_DIMENSIONS.has(parsed.dimension)) return keep("not-quantity");
  const { prefix, word, multiplier } = splitNumericPrefix(raw);
  const maxRaw = Math.max(...nonZero), minRaw = Math.min(...nonZero);
  if (maxRaw * multiplier < MAX_SHOWN && (!prefix || MAN_SERIES.has(prefix))) return keep("small");
  const candidates = CHART_PREFIXES.map((pre) => {
    const factor = multiplier / (scalePrefixMultiplier(pre) ?? 1);
    const shownMax = maxRaw * factor, shownMin = minRaw * factor;
    const decimals = shownMax >= INTEGER_FROM ? 0 : 1;
    return { pre, factor, shownMax, decimals, hidesMin: Number(shownMin.toFixed(decimals)) === 0 };
  });
  const pick = candidates.find((c) => c.shownMax < MAX_SHOWN && !c.hidesMin)
    ?? candidates.find((c) => c.shownMax < MAX_SHOWN_FALLBACK && !c.hidesMin)
    ?? candidates.find((c) => c.shownMax < MAX_SHOWN)
    ?? candidates[candidates.length - 1];
  return { unit: pick.pre + formatUnitForDisplay(word), factor: pick.factor, decimals: pick.decimals, reason: "rescaled" };
}

/**
 * 表示の値。0 でないのに丸めると 0 になる値は「0.1未満」と書き、0 と区別する (県の値を消さない)。
 */
export function formatChartValue(value: number, scale: Pick<ChartDisplayScale, "factor" | "decimals">): string {
  const decimals = scale.decimals ?? 0;
  const shown = value * scale.factor;
  if (value !== 0 && Number(shown.toFixed(decimals)) === 0) {
    return `${shown < 0 ? "-" : ""}${(10 ** -decimals).toFixed(decimals)}未満`;
  }
  return shown.toLocaleString("ja-JP", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
