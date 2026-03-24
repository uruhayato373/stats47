import { logger } from "@stats47/logger";
import { R2Bucket } from "@stats47/r2-storage";

import type { EstatStatsDataResponse, GetStatsDataParams } from '../../types';
import { generateCacheKey } from './generate-cache-key';

/**
 * キャッシュから統計データを取得する
 *
 * @param storage - R2ストレージ
 * @param params - e-Stat APIパラメータ
 */
export async function findStatsDataCache(
  storage: R2Bucket,
  params: GetStatsDataParams
): Promise<EstatStatsDataResponse | null> {
  const key = generateCacheKey(params);
  const data = await storage.get(key);

  if (!data) {
    logger.debug({ key }, "R2統計データキャッシュミス"); // ログを追加
    return null;
  }

  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return parsed.response ?? null;
  } catch (error) {
    logger.error(
      {
        key,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "R2統計データキャッシュパースエラー"
    );
    return null;
  }
}
