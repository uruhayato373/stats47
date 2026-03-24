import { logger } from "@stats47/logger"; // loggerを追加
import { deleteFromR2 } from "@stats47/r2-storage/server";
import type { GetStatsDataParams } from '../../types/get-stats-data-params';
import { generateCacheKey } from './generate-cache-key';

/**
 * 統計データのキャッシュを削除
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @throws {Error} 削除に失敗した場合
 */
export async function deleteStatsDataCache(
  statsDataId: string,
  options: Partial<GetStatsDataParams> = {}
): Promise<void> {
  const key = generateCacheKey({ statsDataId, ...options });
  try {
    await deleteFromR2(key);

    logger.info({ key }, "R2統計データキャッシュ削除");
  } catch (error) {
    logger.error(
      {
        key,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "R2統計データキャッシュ削除エラー"
    );
    throw error;
  }
}
