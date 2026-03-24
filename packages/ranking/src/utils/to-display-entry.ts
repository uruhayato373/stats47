import type { RankingDisplayEntry } from "@stats47/types";
import type { RankingValue } from "../types/ranking-value";

/** RankingValue → RankingDisplayEntry に変換 */
export function toDisplayEntry(rv: RankingValue): RankingDisplayEntry {
  return {
    rank: rv.rank,
    areaCode: rv.areaCode,
    areaName: rv.areaName,
    value: rv.value,
  };
}

/** RankingValue[] → RankingDisplayEntry[] に変換 */
export function toDisplayEntries(
  values: RankingValue[]
): RankingDisplayEntry[] {
  return values.map(toDisplayEntry);
}
