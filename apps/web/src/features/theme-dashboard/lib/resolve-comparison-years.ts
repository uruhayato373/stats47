import type { CatalogMetricGroup } from "@stats47/data-configs/theme-catalog";

const yearOf = (yearCode: string) => String(yearCode).slice(0, 4);

/**
 * 年を固定した比較カード (`comparisonYear`) の年を、R2 に実際にある年へ進める。
 *
 * `comparisonYear` はカードを作ったときに確かめた起点の年である。グループの全指標に値がある、それより新しい年が
 * R2 にあれば (`availableYears`)、その中の最新年を使う。1 指標でも値が無い年へは進めず、指標ごとの最新年にも
 * 代替しない (カードの中で年が割れると県別の比較にならない)。R2 の値と同時に切り替わるので、取り込みより先に
 * 年が進んで「観測値がありません」になることはない。
 *
 * - 同じ指標を含む比較グループは同じ年にそろえる (load-theme-data は指標ごとに 1 つの年しか読まない)
 * - 読めなかった指標 (map に無い) は判定から外す。年の一覧が無い指標 (undefined) があれば起点の年のまま
 */
export function resolveComparisonYears(
  groups: readonly CatalogMetricGroup[],
  availableYearsByKey: ReadonlyMap<string, readonly string[] | undefined>,
): CatalogMetricGroup[] {
  const clusters: CatalogMetricGroup[][] = [];
  for (const group of groups.filter((g) => g.comparisonYear)) {
    const linked = clusters.filter((cluster) =>
      cluster.some((g) => g.rankingKeys.some((key) => group.rankingKeys.includes(key))),
    );
    for (const cluster of linked) clusters.splice(clusters.indexOf(cluster), 1);
    clusters.push([group, ...linked.flat()]);
  }

  const resolved = new Map<CatalogMetricGroup, string>();
  for (const cluster of clusters) {
    // 同じ指標に違う比較年は validate-theme-catalog が止めるので、クラスタの起点は 1 つ
    const base = cluster[0].comparisonYear as string;
    const keys = [...new Set(cluster.flatMap((g) => g.rankingKeys))].filter((key) => availableYearsByKey.has(key));
    const yearSets = keys.map((key) => availableYearsByKey.get(key));
    let year = base;
    if (yearSets.length > 0 && yearSets.every((years) => years !== undefined)) {
      const sets = yearSets.map((years) => new Set((years ?? []).map(yearOf)));
      const common = [...sets[0]].filter((y) => y > base && sets.every((set) => set.has(y)));
      if (common.length > 0) year = common.sort().at(-1) as string;
    }
    for (const group of cluster) resolved.set(group, year);
  }

  return groups.map((group) =>
    resolved.has(group) ? { ...group, comparisonYear: resolved.get(group) } : group,
  );
}
