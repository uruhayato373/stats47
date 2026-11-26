import { PREFECTURE_CAPITAL_CITY_NAMES } from "@stats47/area";
import { formatChartValue, formatUnitForDisplay, resolveMetricDisplayScale } from "@stats47/data-configs/unit";
import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";

import type { RankingItem } from "../types/ranking-item";

/**
 * ランキングの値を画面に書くときの表示単位。表・上位と下位・推移・地図・県の詳細・カードが同じ値を使う。
 * 値は元の単位のまま持ち回り、書くときに倍率を掛ける (順位・偏差値・地図の色は元の値で決まる)。
 */
export interface RankingValueDisplay {
  /** 表示単位 (「万円」「億円」) */
  unit: string;
  /** 元の値に掛ける倍率 */
  factor: number;
  /** 小数桁 */
  precision: number;
}

/**
 * 指標の表示単位を 1 回だけ決める (METRIC-DISPLAY-UNIT-WIRING-01)。
 * 指標の定義が表示単位を書いていればそれ (item.valueDisplay に焼かれている)、無ければ図の規則が値から選ぶ。
 * 決めるのは単位の正典の `resolveMetricDisplayScale` で、2 つを重ねて掛けることはない。
 * 単位を変えない指標は null を返し、呼び出し側は今までどおり観測値の桁で書く。
 */
export function resolveRankingValueDisplay(
  item: Pick<RankingItem, "unit" | "valueDisplay">,
  values: readonly (number | null | undefined)[],
): RankingValueDisplay | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const scale = resolveMetricDisplayScale({ unit: item.unit, display: item.valueDisplay }, finite);
  if (scale.reason !== "authored" && scale.reason !== "rescaled") return null;
  return { unit: scale.unit, factor: scale.factor, precision: scale.decimals ?? 0 };
}

/**
 * 整形済みの文字で届く 1 つの値 (R2 に焼いた 1 位の値「656,171,677」) を、表示単位で書き直す
 * (注目カードと一覧の「1 位」の列。UNIT-NOTATION-FORMAT-01)。「656,171,677千円」を「6,562億円」と書く。
 * 決め方はランキングのページと同じ `resolveRankingValueDisplay` で、定義の表示単位があればそれ、無ければ図の規則。
 * 値は 1 位 (最大) の 1 つしか無いので、図の規則はその値が 5 桁に収まる単位を選ぶ。
 * 数として読めない文字は値をそのまま返す。単位を変えない指標は、小数だけを表と同じ上限 (`resolveValuePrecision`) で丸める。
 */
export function formatFeaturedValueDisplay(
  item: Pick<RankingItem, "unit" | "valueDisplay">,
  value: string,
): { value: string; unit: string } {
  const unchanged = { value, unit: formatUnitForDisplay(item.unit) };
  const text = value.replace(/,/g, "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return unchanged;
  const number = Number(text);
  const display = resolveRankingValueDisplay(item, [number]);
  // 単位を変えない指標も、小数はランキングの表と同じ上限で丸める (R2 の 1 位の値は「40.107」のように元の桁で届く。2026-11-26)
  if (!display) return { value: formatValueWithPrecision(number, resolveValuePrecision([number])), unit: unchanged.unit };
  return { value: formatChartValue(number, { factor: display.factor, decimals: display.precision }), unit: display.unit };
}

/**
 * ランキングの値を 1 つ書く。ランキングのページの表・ヘッダーと同じ書き方 (表示単位への換算と小数桁)。
 * precision と factor は `resolveRankingValueDisplay` か `resolveValuePrecision` で、データセット全体から 1 回決める。
 * 換算するときは単位の正典の `formatChartValue` で書き、0 でないのに 0 に丸まる値を「0.1未満」にする。
 */
export function formatRankingValue(value: number, precision = 1, factor = 1): string {
  if (factor !== 1) return formatChartValue(value, { factor, decimals: precision });
  return formatValueWithPrecision(value, precision);
}

/** 上位の行 1 つ (順位・地域名・表示単位で書いた値) */
export interface FeaturedTopRow {
  rank: number;
  areaName: string;
  value: string;
}

/** カードに並べる上位の行と、その単位 */
export interface FeaturedTopRows {
  unit: string;
  rows: FeaturedTopRow[];
}

/** 上位の行を作る入力の最小形 (values.json の行) */
interface FeaturedTopValueRow {
  areaCode: string;
  areaName: string;
  value: number | null;
  rank: number | null;
}

/** 注目のランキングのカードに並べる順位の上限 (同率で上限の順位に並ぶ行も入れる) */
export const FEATURED_TOP_RANK_LIMIT = 3;
/** 同率で行が増えても、カードに入れる行はここまで (図の型の台帳の上位 3 県と同じく 3 + 1) */
const FEATURED_TOP_MAX_ROWS = FEATURED_TOP_RANK_LIMIT + 1;

/**
 * 注目のランキングのカード (ホーム・カテゴリ・調査) とブログ本文のランキングカードが並べる上位の行を作る唯一の関数。
 * 単位と小数桁はランキングのページの表と同じく全値から 1 回決め、値はその桁で書く (末尾の 0 も残す)。
 * 順位は values の rank をそのまま使い、上限の順位までの同率をすべて入れる (最大 4 行)。
 * 県庁所在市の値の指標 (家計調査など) は、県名を市の名前に替える。
 */
export function buildFeaturedTopRows(
  item: Pick<RankingItem, "unit" | "valueDisplay">,
  values: readonly FeaturedTopValueRow[],
  options: { capitalCities?: boolean } = {},
): FeaturedTopRows | null {
  const ranked = values
    .filter((row): row is FeaturedTopValueRow & { value: number; rank: number } => row.value !== null && row.rank !== null)
    .sort((a, b) => a.rank - b.rank);
  if (ranked.length === 0) return null;
  const all = ranked.map((row) => row.value);
  const display = resolveRankingValueDisplay(item, all);
  const precision = display?.precision ?? resolveValuePrecision(all);
  const factor = display?.factor ?? 1;
  const rows = ranked
    .filter((row) => row.rank <= FEATURED_TOP_RANK_LIMIT)
    .slice(0, FEATURED_TOP_MAX_ROWS)
    .map((row) => ({
      rank: row.rank,
      areaName: (options.capitalCities ? PREFECTURE_CAPITAL_CITY_NAMES[row.areaCode] : undefined) ?? row.areaName,
      value: formatRankingValue(row.value, precision, factor),
    }));
  return { unit: display?.unit ?? formatUnitForDisplay(item.unit), rows };
}
