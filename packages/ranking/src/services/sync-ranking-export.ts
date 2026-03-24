import { logger } from "@stats47/logger/server";

import { type RankingItem } from "@stats47/ranking";
import type { AreaType } from "@stats47/types";
import { updateRankingItem } from "../repositories/ranking-item";
import { upsertRankingValues } from "../repositories/ranking-value";
import type { SyncRankingResult } from "../types";
import { fetchRankingData } from "./fetch-ranking-data";

/**
 * ランキングのエクスポートとメタデータの同期を一括で行う
 * (Server Actionからの利用を想定したオーケストレーション関数)
 *
 * @param rankingItem - ランキング項目
 * @param options - オプション (中断チェック用)
 * @returns 処理結果
 */
export async function syncRankingExport(
  rankingItem: RankingItem,
  options?: { isAborted?: () => boolean; skipDbSave?: boolean }
): Promise<SyncRankingResult> {
  const { rankingKey, areaType } = rankingItem;

  try {
    // 1. 最新年度データを取得
    const result = await fetchRankingData(rankingItem, options);

    if (!result.success) {
      return result;
    }

    // 最新のメタデータを保持する変数（DB更新があれば更新される）
    let currentItem = { ...rankingItem };

    // 2. 成功した場合、年度情報をDBに反映
    if (result.years && result.years.length > 0) {
      const latestYear = result.years[0];
      const availableYears = result.years;

      if (!options?.skipDbSave) {
        const updateResult = await updateRankingItem(rankingKey, areaType as AreaType, {
          latestYear,
          availableYears,
        });

        if (updateResult.success) {
          currentItem = {
            ...currentItem,
            latestYear,
            availableYears,
          };
          logger.debug({ rankingKey, areaType, latestYear }, "年度情報をDBに反映しました");
        } else {
          logger.warn(
            { rankingKey, areaType, error: updateResult.error.message },
            "年度情報のDB反映に失敗しました（処理自体は継続します）"
          );
        }
      }

      // 最新年度のランキング値のみ ranking_data に格納
      // （過去年度はオンデマンドで e-Stat API から取得しキャッシュする）
      if (!options?.skipDbSave) {
        // allYearsValues から最新年度分を抽出、なければ latestYearValues を使用
        const latestValues = result.allYearsValues
          ? result.allYearsValues.filter((v) => v.yearCode === latestYear.yearCode)
          : result.latestYearValues;

        if (latestValues && latestValues.length > 0) {
          const upsertResult = await upsertRankingValues(
            rankingKey,
            areaType,
            latestYear.yearCode,
            latestYear.yearName,
            rankingItem.title,
            latestValues
          );
          if (upsertResult.success) {
            logger.debug(
              { rankingKey, areaType, yearCode: latestYear.yearCode, count: upsertResult.data },
              "最新年度データを ranking_data に格納しました"
            );
          } else {
            const errorMsg = upsertResult.error?.message || "ranking_data への格納に失敗しました";
            logger.warn(
              { rankingKey, areaType, error: errorMsg },
              errorMsg
            );
            return {
              ...result,
              success: false,
              error: errorMsg
            };
          }
        }
      }
    }



    return result;
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "データ同期処理失敗");
    return {
      success: false,
      error: error instanceof Error ? error.message : "データ同期処理に失敗しました",
    };
  }
}
