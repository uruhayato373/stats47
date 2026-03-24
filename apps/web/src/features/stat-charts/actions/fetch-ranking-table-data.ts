"use server";

import { err, ok, type Result } from "@stats47/types";
import { RankingItem, RankingValue } from "@stats47/ranking";
import { findRankingItemByKey, findLatestYear, listRankingValues } from "@stats47/ranking/server";

export interface FetchRankingTableDataResult {
  rankingItem: RankingItem | null;
  rankingValues: RankingValue[];
  yearCode: string | null;
  yearName: string | null;
}

/**
 * ダッシュボードのデータテーブル用にランキングデータを取得する
 */
export async function fetchRankingTableDataAction(
  rankingKey: string,
  yearCode?: string
): Promise<Result<FetchRankingTableDataResult, string>> {
  try {
    // 1. ランキング項目を取得
    const itemResult = await findRankingItemByKey(rankingKey);
    if (!itemResult.success || !itemResult.data) {
      return err("ランキング項目が見つかりませんでした");
    }
    const rankingItem = itemResult.data;

    // 2. 年度の決定
    let targetYearCode = yearCode;
    let targetYearName = "";

    if (!targetYearCode) {
      // 指定がない場合は最新年度を取得
      if (rankingItem.latestYear) {
         try {
             // JSONパース済みオブジェクトか文字列かを確認
             const latestYearObj = typeof rankingItem.latestYear === 'string'
                ? JSON.parse(rankingItem.latestYear as string)
                : rankingItem.latestYear;

             targetYearCode = latestYearObj.yearCode;
             targetYearName = latestYearObj.yearName;
         } catch (e) {
             // パースエラー等の場合はリポジトリから最新を探す
             const latest = await findLatestYear(rankingItem.areaType);
             if (latest.success && latest.data) {
                 targetYearCode = latest.data;
             }
         }
      }

      if (!targetYearCode) {
           const latest = await findLatestYear(rankingItem.areaType);
           if (latest.success && latest.data) {
               targetYearCode = latest.data;
           }
      }
    }

    if (!targetYearCode) {
        return ok({
            rankingItem,
            rankingValues: [],
            yearCode: null,
            yearName: null
        });
    }

    // 3. ランキング値を取得
    const valuesResult = await listRankingValues(
      rankingKey,
      rankingItem.areaType,
      targetYearCode
    );

    if (!valuesResult.success) {
      return err(valuesResult.error.message);
    }

    return ok({
      rankingItem,
      rankingValues: valuesResult.data,
      yearCode: targetYearCode,
      yearName: targetYearName || `${targetYearCode}年度`
    });

  } catch (error) {
    console.error("fetchRankingTableDataAction error:", error);
    return err("データの取得中にエラーが発生しました");
  }
}
