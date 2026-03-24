
import { getMaxDecimalPlaces } from "@stats47/utils";
import type { RankingValue } from "../types";

/**
 * ランキングデータから value の最大小数点以下桁数を取得
 *
 * @param data - ランキング値配列
 * @returns 最大の小数点以下桁数
 *
 * @example
 * ```ts
 * const rankings = [
 *   { value: 1.5, ... },
 *   { value: 2.345, ... },
 *   { value: 3, ... },
 * ];
 * const maxDecimals = getMaxDecimalPlacesFromRankings(rankings);
 * // => 3
 * ```
 */
export function getMaxDecimalPlacesFromRankings(
  data: RankingValue[]
): number {
  if (data.length === 0) return 0;

  const values = data.map((item) => item.value);
  return getMaxDecimalPlaces(values);
}
