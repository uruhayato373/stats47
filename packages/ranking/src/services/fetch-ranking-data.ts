import { logger } from "@stats47/logger/server";
import type { RankingItem } from "../index";
import type { SyncRankingResult } from "../types/sync-ranking-result";
import { fetchCalculatedRankingData } from "./fetch-ranking-data-calculated";
import { fetchEstatRankingData } from "./fetch-ranking-data-estat";

/**
 * RankingItemの最新年度データを取得する
 * (e-Stat取得または計算処理へのディスパッチを行う)
 *
 * @param rankingItem - ランキング項目
 * @param options - オプション (中断チェック用)
 * @returns エクスポート結果
 */
export async function fetchRankingData(
  rankingItem: RankingItem,
  options?: { isAborted?: () => boolean }
): Promise<SyncRankingResult> {
  const { rankingKey, areaType, calculation } = rankingItem;

  try {
    // 中断チェック
    if (options?.isAborted?.()) {
      return { success: false, error: "中断されました" };
    }

    if (calculation?.isCalculated) {
      // 計算型ランキング
      return fetchCalculatedRankingData(rankingItem, options);
    } else {
      // 通常ランキング（e-Stat）
      return fetchEstatRankingData(rankingItem, options);
    }
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "ランキングデータ取得失敗");
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "エクスポートに失敗しました",
    };
  }
}
