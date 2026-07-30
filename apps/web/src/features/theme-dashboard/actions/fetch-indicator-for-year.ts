"use server";

import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";
import {
  fetchRankingValuesFromSource,
  filterOutNationalArea,
  isDerivedSource,
  rankByValue,
  readRankingItemFromR2,
  resolveEstatParams,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { getEstatCacheStorage } from "@/components/stat-charts/server";

import type { RankingValue } from "@stats47/ranking";

/**
 * 指定指標・年度のランキングデータを取得するサーバーアクション
 *
 * e-Stat API から cdTime/cdArea 指定なしで全年度・全都道府県を一括取得（R2 キャッシュ共有）し、
 * yearCode でメモリフィルタして返す。
 */
export async function fetchIndicatorForYearAction(
  rankingKey: string,
  yearCode: string,
): Promise<RankingValue[]> {
  const result = await readRankingItemFromR2(rankingKey, "prefecture");
  if (!result || !isOk(result) || !result.data) return [];

  const rankingItem = result.data;
  const { sourceConfig, calculation } = rankingItem;

  // 計算型アイテム / 宣言演算を伴う metric (tab 線形結合・軸合算・率・県庁所在市写像) は
  // e-Stat 単発クエリで再現できない。正典 (app/stats/<key>/values.json) を読む既存ロジックに委譲する。
  if (calculation?.isCalculated || isDerivedSource(sourceConfig)) {
    return fetchRankingValuesFromSource(rankingItem, yearCode);
  }

  // ★sourceConfig を丸ごと spread しない (軸の欠落と非クエリキー混入を防ぐ)
  const params = resolveEstatParams(sourceConfig);
  if (!params) return [];

  try {
    const storage = await getEstatCacheStorage();
    const rawData = await fetchFormattedStats(params as GetStatsDataParams, storage);
    const filteredData = filterOutNationalArea(rawData)
      .filter((d) => d.yearCode === yearCode);
    if (filteredData.length === 0) return [];

    return rankByValue(filteredData) as RankingValue[];
  } catch {
    return [];
  }
}
