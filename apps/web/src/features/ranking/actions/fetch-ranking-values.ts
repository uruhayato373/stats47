"use server";

import {
  computeNormalization,
  fetchRankingValuesOnDemand,
  readRankingValuesFromR2,
  readRankingItemFromR2,
} from "@stats47/ranking/server";
import { err, isOk, ok, type Result } from "@stats47/types";

import type { AreaType } from "@stats47/area";
import type { RankingValue } from "@stats47/ranking";

/**
 * ランキングデータを取得する（正規化対応）
 *
 * @param parentAreaCode 都道府県コード（市区町村フィルタ用、例: "13000"）
 */
export async function fetchRankingValuesAction(
  rankingKey: string,
  areaType: AreaType,
  yearCode: string,
  normalizationType?: string,
  parentAreaCode?: string,
): Promise<Result<RankingValue[], Error>> {
  try {
    // アイテム情報を取得
    const itemResult = await readRankingItemFromR2(rankingKey, areaType);
    if (!isOk(itemResult) || !itemResult.data) {
      return err(new Error("Ranking item not found"));
    }
    const rankingItem = itemResult.data;

    let values: RankingValue[];

    // 正規化が指定されている場合
    if (normalizationType) {
      values = await computeNormalization(
        rankingItem,
        yearCode,
        normalizationType
      );
    } else {
      // DB から取得（なければ e-Stat API からオンデマンド取得 + キャッシュ）
      const result = await readRankingValuesFromR2(rankingKey, areaType, yearCode);
      if (!isOk(result)) return result;
      values = result.data;

      if (values.length === 0) {
        values = await fetchRankingValuesOnDemand(rankingItem, yearCode);
      }
    }

    // 都道府県内フィルタ
    if (parentAreaCode) {
      const prefPrefix = parentAreaCode.slice(0, 2);
      values = values.filter((v) => v.areaCode.startsWith(prefPrefix));
      values.sort((a, b) => b.value - a.value);
      values = values.map((v, i) => ({ ...v, rank: i + 1 }));
    }

    return ok(values);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
