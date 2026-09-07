interface RankingImageYear {
  yearCode?: string;
  yearName?: string;
}

/** OGP/card use the declared latest year, regardless of ascending/descending inventory order. */
export function selectRankingImagePartition<T extends { yearCode?: string }>(
  item: { latestYear?: RankingImageYear; availableYears?: RankingImageYear[] },
  partitions: readonly T[],
): { partition: T; yearCode: string; yearName: string } {
  const years = item.availableYears?.length ? item.availableYears : partitions;
  const latest = item.latestYear?.yearCode
    ? item.latestYear
    : [...years].sort((a, b) => Number(b.yearCode) - Number(a.yearCode))[0];
  const yearCode = latest?.yearCode;
  if (!yearCode || !/^\d{4}$/.test(yearCode)) {
    throw new Error('Ranking image latest year is missing or invalid');
  }
  const partition = partitions.find((candidate) => candidate.yearCode === yearCode);
  if (!partition) {
    throw new Error(`Ranking image latest year ${yearCode} has no values partition`);
  }
  const yearName = ('yearName' in latest ? latest.yearName : undefined)
    ?? item.availableYears?.find((year) => year.yearCode === yearCode)?.yearName
    ?? `${yearCode}年`;
  return { partition, yearCode, yearName };
}
