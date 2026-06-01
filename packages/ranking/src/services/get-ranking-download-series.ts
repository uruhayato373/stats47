import "server-only";

import { isOk } from "@stats47/types";
import type { AreaType } from "@stats47/types";

import {
  listRankingValuesAllYears,
  readAllYearsNormalizedRankingValuesFromR2,
} from "../repositories/ranking-value";
import type { RankingValue } from "../types";

/** ダウンロード用の 1 基準系列 (CSV/JSON 整形の入力)。 */
export interface RankingDownloadSeries {
  basisKey: string;
  basisLabel: string;
  values: RankingValue[];
}

const NORM_TYPES = ["per_population", "per_area", "per_household"] as const;

const BASIS_LABELS: Record<string, string> = {
  original: "総数",
  per_population: "人口10万人あたり",
  per_area: "面積100km²あたり",
  per_household: "1世帯あたり",
};

/**
 * ランキングのダウンロード用系列を **R2 観測値からオンザフライ生成**する
 * (事前 bake しない = R2 肥大化なし、完全DBレス)。
 *
 * - `original`           : app/stats/<key>/values.json (全年)
 * - `per_*`              : app/ranking/<key>/values-<normType>.json (無ければ空 = 404 相当)
 * - `all-bases`          : original + 存在する正規化系列を横並び
 *
 * 値が 1 件も無い場合は空配列を返す (route 側で 404)。
 * Route Handler `/api/ranking/[key]/download` から呼ばれる。
 */
export async function getRankingDownloadSeries(
  rankingKey: string,
  areaType: AreaType,
  basis: string,
): Promise<RankingDownloadSeries[]> {
  const originalResult = await listRankingValuesAllYears(rankingKey, areaType);
  const original = isOk(originalResult) ? originalResult.data : [];

  if (basis === "original") {
    if (original.length === 0) return [];
    return [{ basisKey: "original", basisLabel: BASIS_LABELS.original, values: original }];
  }

  if (basis === "all-bases") {
    if (original.length === 0) return [];
    const series: RankingDownloadSeries[] = [
      { basisKey: "original", basisLabel: BASIS_LABELS.original, values: original },
    ];
    for (const normType of NORM_TYPES) {
      const normResult = await readAllYearsNormalizedRankingValuesFromR2(
        rankingKey,
        areaType,
        normType,
      );
      const normValues = isOk(normResult) ? normResult.data : [];
      if (normValues.length === 0) continue;
      series.push({
        basisKey: normType,
        basisLabel: BASIS_LABELS[normType] ?? normType,
        values: normValues,
      });
    }
    return series;
  }

  // 個別の正規化基準 (per_population / per_area / per_household)
  const normResult = await readAllYearsNormalizedRankingValuesFromR2(
    rankingKey,
    areaType,
    basis,
  );
  const normValues = isOk(normResult) ? normResult.data : [];
  if (normValues.length === 0) return [];
  return [{ basisKey: basis, basisLabel: BASIS_LABELS[basis] ?? basis, values: normValues }];
}
