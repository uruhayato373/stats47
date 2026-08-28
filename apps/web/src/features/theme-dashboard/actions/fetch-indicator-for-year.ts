"use server";

import {
  filterOutNationalArea,
  rankByValue,
  readRankingItemFromR2,
} from "@stats47/ranking/server";
import { readStatsValues } from "@stats47/stats-r2/readers";
import { isOk } from "@stats47/types";

import type { RankingValue } from "@stats47/ranking";

/**
 * 指定指標・年度のランキングデータを取得するサーバーアクション
 *
 * 正典 `app/stats/<metricKey>/values.json` を読み、yearCode でメモリフィルタする。
 * Web runtime から e-Stat へはフォールバックしない。
 */
export async function fetchIndicatorForYearAction(
  rankingKey: string,
  yearCode: string,
): Promise<RankingValue[]> {
  const result = await readRankingItemFromR2(rankingKey, "prefecture");
  if (!result || !isOk(result) || !result.data) return [];

  try {
    const payload = await readStatsValues(rankingKey, "prefecture");
    if (!payload) return [];
    const filteredData = filterOutNationalArea(payload.rows)
      .filter((d) => d.yearCode === yearCode);
    if (filteredData.length === 0) return [];

    return rankByValue(filteredData) as RankingValue[];
  } catch {
    return [];
  }
}
