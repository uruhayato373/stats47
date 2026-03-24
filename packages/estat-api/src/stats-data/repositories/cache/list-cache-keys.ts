import { logger } from "@stats47/logger"; // loggerを追加
import { listFromR2 } from "@stats47/r2-storage/server"; // listFromR2を追加

/**
 * 統計表ID配下のすべてのキャッシュキーを一覧取得
 *
 * R2ストレージから指定された統計表ID配下のすべてのキャッシュキーを取得します。
 *
 * @param statsDataId - 統計表ID
 * @returns キャッシュキーの配列
 */
export async function listStatsDataCacheKeys(
  statsDataId: string
): Promise<string[]> {
  try {
    const prefix = `estat-api/stats-data/${statsDataId}/`;
    const keys = await listFromR2(prefix);
    const filteredKeys = keys.filter(
      (key: string) => key.startsWith(prefix) && key.endsWith(".json")
    );

    logger.info(
      { statsDataId, count: filteredKeys.length },
      `R2統計データキャッシュキー一覧取得: ${statsDataId} (${filteredKeys.length}件)`
    );

    return filteredKeys;
  } catch (error) {
    logger.error(
      {
        statsDataId,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "R2統計データキャッシュキー一覧取得エラー"
    );
    return [];
  }
}
