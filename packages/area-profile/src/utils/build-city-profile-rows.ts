import { extractStrengthsAndWeaknesses } from "./extract-strengths-and-weaknesses";

/** バッチ集約時の市区町村データ */
export interface CityRankingData {
  rankingKey: string;
  indicator: string;
  year: string;
  /** 県内ランク (1-N、N は県内の市区町村数) */
  rankPref: number;
  /** 全国ランク (1-2701)。将来の用途用 */
  rankNational: number;
  value: number;
  unit: string;
  areaName: string;
}

/** DB INSERT 用の行データ */
export interface CityProfileRow {
  areaCode: string;
  areaName: string;
  year: string;
  indicator: string;
  rankingKey: string;
  type: "strength" | "weakness";
  rank: number;
  value: number;
  unit: string;
  percentile: number;
  createdAt: string;
}

/** 県内 city 数の推定値 (percentile 計算用、prefecture 平均 ~57) */
const APPROX_CITIES_PER_PREFECTURE = 57;

/**
 * 市区町村データから「県内 top 5 = 強み」を抽出し、DB INSERT 用の行を生成する。
 *
 * 設計判断 (Phase 1 MVP):
 * - rank_pref (県内ランク) を使う。県内 1位-5位が強み。
 * - 弱みは Phase 1 MVP では生成しない (各県の city 数が異なり、絶対閾値が不安定)
 * - 弱みは Phase 1 後半で追加検討 (e.g., rank_pref = pref内最下位)
 *
 * 純粋関数 (DB 非依存)。
 */
export function buildCityProfileRows(
  cityCode: string,
  cityName: string,
  dataList: CityRankingData[],
  createdAt: string,
): CityProfileRow[] {
  // rank_pref を rank として extract に渡す
  const dataWithRank = dataList.map((d) => ({ ...d, rank: d.rankPref }));

  // 強みのみ抽出 (top 5 in prefecture)、weakness は無効化
  const { strengths } = extractStrengthsAndWeaknesses(dataWithRank, {
    strengthMax: 5,
    weaknessMin: 9999,
    maxRank: 9999,
  });

  return strengths.map((s) => ({
    areaCode: cityCode,
    areaName: cityName,
    year: s.year,
    indicator: s.indicator,
    rankingKey: s.rankingKey,
    type: "strength" as const,
    rank: s.rankPref,
    value: s.value,
    unit: s.unit,
    // percentile は県内位置 (1位=100、最下位=0)。N が不明なので近似 57 で計算
    percentile: ((APPROX_CITIES_PER_PREFECTURE - s.rankPref) /
      (APPROX_CITIES_PER_PREFECTURE - 1)) * 100,
    createdAt,
  }));
}
