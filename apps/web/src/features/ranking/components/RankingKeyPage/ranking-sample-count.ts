import type { RankingReferenceValue, RankingValue } from "@stats47/ranking";

export interface RankingSampleCountSummary {
  /** 順位を付けた県と参考値の県の推計の人数の合計。順位を付けた県の人数が取れない年は null */
  total: number | null;
  /** 推計の人数が分かった県の数 */
  areaCount: number;
  /** 順位を付けた県で推計の人数が最も少ない県 */
  smallest: { areaName: string; sampleCount: number } | null;
  /** 順位から外した参考値 (推計の人数の少ない順) */
  references: RankingReferenceValue[];
}

/**
 * 表の下に出す推計の人数の要約。推計の人数を持たない指標 (source.sampleCount を宣言していない) は null。
 * DATA-WAGE-TEACHER-COVERAGE-01 (2026-11-14 オーナー決定: 推計の人数と参考値をページに出す)。
 */
export function summarizeSampleCounts(
  rankingValues: readonly RankingValue[],
  referenceValues: readonly RankingReferenceValue[],
  yearCode: string,
): RankingSampleCountSummary | null {
  const year = String(yearCode).slice(0, 4);
  const ranked = rankingValues.filter(
    (v): v is RankingValue & { sampleCount: number } => v.areaCode !== "00000" && typeof v.sampleCount === "number",
  );
  const references = referenceValues
    .filter((v) => String(v.yearCode).slice(0, 4) === year)
    .sort((a, b) => a.sampleCount - b.sampleCount || a.areaCode.localeCompare(b.areaCode));
  if (ranked.length === 0 && references.length === 0) return null;
  const smallest = ranked.reduce<(typeof ranked)[number] | null>(
    (min, v) => (min === null || v.sampleCount < min.sampleCount ? v : min),
    null,
  );
  return {
    total: ranked.length > 0 ? [...ranked, ...references].reduce((sum, v) => sum + v.sampleCount, 0) : null,
    areaCount: ranked.length + references.length,
    smallest: smallest ? { areaName: smallest.areaName, sampleCount: smallest.sampleCount } : null,
    references,
  };
}
