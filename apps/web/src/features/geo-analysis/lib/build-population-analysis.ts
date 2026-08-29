import type { RankingValue } from '@stats47/ranking';

export interface PopulationAnalysisRow {
  areaCode: string;
  areaName: string;
  value: number;
  rank: number;
}

export interface PopulationAnalysisSummary {
  rows: PopulationAnalysisRow[];
  top: PopulationAnalysisRow[];
  bottom: PopulationAnalysisRow[];
  positiveCount: number;
  negativeCount: number;
  zeroCount: number;
  average: number;
  median: number;
  range: number;
}

function rounded(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * R2 の2050年ランキング値を、Geo分析画面用の決定的な要約へ変換する。
 * null と全国集計は除外し、同順位でも rank → areaCode の順で安定化する。
 */
export function buildPopulationAnalysis(
  values: readonly RankingValue[]
): PopulationAnalysisSummary {
  const rows = values
    .filter(
      (value): value is RankingValue & { value: number } =>
        value.value !== null && value.areaCode !== '00000'
    )
    .map((value) => ({
      areaCode: value.areaCode,
      areaName: value.areaName,
      value: value.value,
      rank: value.rank,
    }))
    .sort((a, b) => a.rank - b.rank || a.areaCode.localeCompare(b.areaCode));

  if (rows.length === 0) {
    return {
      rows: [],
      top: [],
      bottom: [],
      positiveCount: 0,
      negativeCount: 0,
      zeroCount: 0,
      average: 0,
      median: 0,
      range: 0,
    };
  }

  const valuesAscending = rows.map((row) => row.value).sort((a, b) => a - b);
  const middle = Math.floor(valuesAscending.length / 2);
  const median =
    valuesAscending.length % 2 === 0
      ? ((valuesAscending[middle - 1] ?? 0) + (valuesAscending[middle] ?? 0)) /
        2
      : (valuesAscending[middle] ?? 0);
  const highest = rows[0]?.value ?? 0;
  const lowest = rows.at(-1)?.value ?? 0;

  return {
    rows,
    top: rows.slice(0, 5),
    bottom: rows.slice(-5).reverse(),
    positiveCount: rows.filter((row) => row.value > 0).length,
    negativeCount: rows.filter((row) => row.value < 0).length,
    zeroCount: rows.filter((row) => row.value === 0).length,
    average: rounded(
      rows.reduce((total, row) => total + row.value, 0) / rows.length
    ),
    median: rounded(median),
    range: rounded(highest - lowest),
  };
}
