import { resolveMetricDisplayScale } from "@stats47/data-configs/unit";

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
 * 値を整形済みの文字で持つ面 (ブログ本文のランキングカードの上位 3 県) のために、行の値を表示単位へ直す。
 * 順位は元の値で付いたものをそのまま使う。表示単位が無ければ行をそのまま返す。
 */
export function applyRankingValueDisplay<T extends { value: number | null }>(rows: readonly T[], display: RankingValueDisplay | null): T[] {
  if (!display) return [...rows];
  return rows.map((row) => (row.value === null ? row : { ...row, value: Number((row.value * display.factor).toFixed(display.precision)) }));
}
