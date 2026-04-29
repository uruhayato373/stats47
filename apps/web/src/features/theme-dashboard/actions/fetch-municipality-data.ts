"use server";

import { fetchMunicipalityTopology } from "@stats47/gis/geoshape";
import { readRankingValuesByPrefectureFromR2 } from "@stats47/ranking/server";
import { isOk, type TopoJSONTopology } from "@stats47/types";

import type { RankingValue } from "@stats47/ranking";

export interface MunicipalityDrilldownResult {
  topology: TopoJSONTopology;
  values: RankingValue[];
}

/**
 * 市区町村ドリルダウン用データ取得
 *
 * 都道府県クリック時に呼び出し、市区町村の TopoJSON + ランキングデータを返す。
 * 市区町村データがない場合は null を返す。
 */
export async function fetchMunicipalityDrilldownAction(
  rankingKey: string,
  prefCode: string,
  yearCode: string,
): Promise<MunicipalityDrilldownResult | null> {
  try {
    const prefCodeShort = prefCode.slice(0, 2);

    const [topology, valuesResult] = await Promise.all([
      fetchMunicipalityTopology(prefCodeShort).catch(() => null),
      readRankingValuesByPrefectureFromR2(rankingKey, yearCode, prefCode),
    ]);

    if (!topology) return null;

    const values = isOk(valuesResult) ? valuesResult.data : [];
    if (values.length === 0) return null;

    return { topology, values };
  } catch {
    return null;
  }
}
