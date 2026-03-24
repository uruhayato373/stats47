import { extractStrengthsAndWeaknesses } from "./extract-strengths-and-weaknesses";

/** 都道府県数 */
const NUM_PREFECTURES = 47;

/** バッチ集約時の地域データ */
export interface AreaRankingData {
  rankingKey: string;
  indicator: string;
  year: string;
  rank: number;
  value: number;
  unit: string;
  areaName: string;
}

/** DB INSERT 用の行データ（id, createdAt を除く） */
export interface AreaProfileRow {
  areaCode: string;
  areaName: string;
  year: string;
  indicator: string;
  rankingKey: string;
  type: string;
  rank: number;
  value: number;
  unit: string;
  percentile: number;
  createdAt: string;
}

/**
 * 順位からパーセンタイルを計算する（純粋関数）
 */
export function computePercentile(rank: number): number {
  return ((NUM_PREFECTURES - rank) / (NUM_PREFECTURES - 1)) * 100;
}

/**
 * 地域データから強み・弱みを判定し、DB INSERT 用の行データを生成する（純粋関数）
 */
export function buildAreaProfileRows(
  areaCode: string,
  areaName: string,
  dataList: AreaRankingData[],
  createdAt: string,
): AreaProfileRow[] {
  const { strengths, weaknesses } = extractStrengthsAndWeaknesses(dataList);

  return [
    ...strengths.map((s) => ({
      areaCode,
      areaName,
      year: s.year,
      indicator: s.indicator,
      rankingKey: s.rankingKey,
      type: "strength" as const,
      rank: s.rank,
      value: s.value,
      unit: s.unit,
      percentile: computePercentile(s.rank),
      createdAt,
    })),
    ...weaknesses.map((w) => ({
      areaCode,
      areaName,
      year: w.year,
      indicator: w.indicator,
      rankingKey: w.rankingKey,
      type: "weakness" as const,
      rank: w.rank,
      value: w.value,
      unit: w.unit,
      percentile: computePercentile(w.rank),
      createdAt,
    })),
  ];
}
