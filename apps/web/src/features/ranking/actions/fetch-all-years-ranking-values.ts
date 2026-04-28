"use server";

import { cache } from "react";

import { fetchAllYearsRankingValuesOnDemand, readRankingItemFromR2 } from "@stats47/ranking/server";
import { err, ok, isOk, type Result } from "@stats47/types";

import type { AreaType } from "@stats47/area";
import type { RankingValue } from "@stats47/ranking";

/**
 * 全年分のランキングデータを取得する（内部キャッシュ付き）
 *
 * React `cache()` でリクエスト単位にデダップされる。
 * 同一リクエスト内で TrendSparklineCard と DataDownloadCard が
 * 同じ rankingKey で呼んでも DB クエリは 1 回のみ。
 */
const fetchAllYearsCore = cache(async (
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingValue[], Error>> => {
  try {
    const itemResult = await readRankingItemFromR2(rankingKey, areaType);
    if (!isOk(itemResult) || !itemResult.data) {
      return err(new Error("Ranking item not found"));
    }

    const values = await fetchAllYearsRankingValuesOnDemand(itemResult.data);
    return ok(values);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
});

/**
 * 全年分のランキングデータを取得する（TrendSparkline・データダウンロード用）
 *
 * DB キャッシュを確認し、不足分があれば e-Stat API から一括取得する。
 *
 * @param parentAreaCode 都道府県コード（市区町村フィルタ用、例: "13000"）
 */
export async function fetchAllYearsRankingValuesAction(
  rankingKey: string,
  areaType: AreaType,
  parentAreaCode?: string,
): Promise<Result<RankingValue[], Error>> {
  const result = await fetchAllYearsCore(rankingKey, areaType);
  if (!isOk(result)) return result;

  if (!parentAreaCode) return result;

  // 都道府県内の市区町村に絞り込み、年度ごとに順位を振り直す
  const prefPrefix = parentAreaCode.slice(0, 2);
  const filtered = result.data.filter((v) => v.areaCode.startsWith(prefPrefix));

  const byYear = new Map<string, RankingValue[]>();
  for (const v of filtered) {
    const arr = byYear.get(v.yearCode);
    if (arr) arr.push(v);
    else byYear.set(v.yearCode, [v]);
  }
  const reranked: RankingValue[] = [];
  for (const vals of byYear.values()) {
    vals.sort((a, b) => b.value - a.value);
    for (let i = 0; i < vals.length; i++) {
      reranked.push({ ...vals[i], rank: i + 1 });
    }
  }

  return ok(reranked);
}
