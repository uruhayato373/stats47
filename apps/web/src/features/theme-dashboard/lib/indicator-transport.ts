import type { ThemeIndicatorData } from "../types";
import type { RankingValue } from "@stats47/ranking";


/**
 * サーバーからブラウザへ渡す指標データを小さくする (PERF-THEME-HTML-SIZE-01)。
 *
 * テーマのページは全指標の 47 都道府県の値を ThemeDashboardClient へ渡し、行ごとに `metricKey`・`areaType`・
 * `yearCode`・`yearName`・`unit` をくり返していた。2026-11-23 の本番で `/themes/household-food-spending` の
 * HTML は 4.4MB、そのうち値の行 (189 指標 × 47 行) が 1.5MB だった。
 *
 * 指標ごとに「全行で同じ値の項目」を 1 回だけ持ち、残りを行に残す。ブラウザ側で元の行の形に戻すので、
 * 行を読む部品は変えない。どの項目をまとめるかは値から決め、値が行で違う項目はまとめない (情報を落とさない)。
 */
export interface PackedRankingValues {
  shared: Partial<RankingValue>;
  rows: Partial<RankingValue>[];
}

export type PackedThemeIndicatorData = Omit<ThemeIndicatorData, "rankingValues"> & {
  rankingValues: PackedRankingValues;
};

const sameValue = (a: unknown, b: unknown) => a === b || (a !== null && typeof a === "object" && JSON.stringify(a) === JSON.stringify(b));

export function packRankingValues(values: readonly RankingValue[]): PackedRankingValues {
  if (values.length < 2) return { shared: {}, rows: values.map((v) => ({ ...v })) };
  const keys = new Set(values.flatMap((v) => Object.keys(v))) as Set<keyof RankingValue>;
  const shared: Partial<RankingValue> = {};
  for (const key of keys) {
    const first = values[0][key];
    if (values.every((v) => key in v && sameValue(v[key], first))) {
      (shared as Record<string, unknown>)[key] = first;
    }
  }
  const rows = values.map((v) => {
    const row: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(v)) if (!(key in shared)) row[key] = value;
    return row as Partial<RankingValue>;
  });
  return { shared, rows };
}

export function unpackRankingValues(packed: PackedRankingValues): RankingValue[] {
  return packed.rows.map((row) => ({ ...packed.shared, ...row }) as RankingValue);
}

export function packIndicatorDataMap(
  map: Record<string, ThemeIndicatorData>,
): Record<string, PackedThemeIndicatorData> {
  return Object.fromEntries(
    Object.entries(map).map(([key, data]) => [key, { ...data, rankingValues: packRankingValues(data.rankingValues) }]),
  );
}

export function unpackIndicatorDataMap(
  map: Record<string, PackedThemeIndicatorData>,
): Record<string, ThemeIndicatorData> {
  return Object.fromEntries(
    Object.entries(map).map(([key, data]) => [key, { ...data, rankingValues: unpackRankingValues(data.rankingValues) }]),
  );
}
