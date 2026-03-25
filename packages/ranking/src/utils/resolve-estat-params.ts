import type { GetStatsDataParams } from "@stats47/estat-api/server";
import type { AreaType } from "@stats47/types";
import { isOk } from "@stats47/types";

import { findRankingItem } from "../repositories/ranking-item";

/**
 * rankingKey から e-Stat API パラメータ (GetStatsDataParams) を解決する
 *
 * ranking_items.source_config から statsDataId, cdCat01 等を抽出。
 * source_config に statsDataId がない（計算型等）場合は null を返す。
 */
export async function resolveEstatParams(
  rankingKey: string,
  areaType: AreaType = "prefecture"
): Promise<GetStatsDataParams | null> {
  const result = await findRankingItem(rankingKey, areaType);
  if (!isOk(result) || !result.data) return null;

  const sc = result.data.sourceConfig;
  if (!sc?.statsDataId) return null;

  const params: GetStatsDataParams = {
    statsDataId: sc.statsDataId,
    ...(sc.cdCat01 && { cdCat01: sc.cdCat01 }),
    ...(sc.cdCat02 && { cdCat02: sc.cdCat02 }),
    ...(sc.cdCat03 && { cdCat03: sc.cdCat03 }),
    ...(sc.cdTab && { cdTab: sc.cdTab }),
  };

  return params;
}
