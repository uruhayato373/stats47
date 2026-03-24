import { logger } from "@stats47/logger";
import { R2Bucket } from '@stats47/r2-storage';
import type { EstatStatsDataResponse, GetStatsDataParams } from '../../types';
import { generateCacheKey } from './generate-cache-key';
import { sanitizeMetadata } from './sanitize-metadata';

/**
 * 統計データをキャッシュに保存する
 *
 * @param storage - R2ストレージ
 * @param params - e-Stat APIパラメータ
 * @param data - 保存するデータ
 */
export async function saveStatsDataCache(
  storage: R2Bucket,
  params: GetStatsDataParams,
  data: EstatStatsDataResponse
): Promise<void> {
  const key = generateCacheKey(params);
  const metadata = sanitizeMetadata(data.GET_STATS_DATA?.STATISTICAL_DATA?.TABLE_INF?.TITLE?.$ || ""); // 適切な値に修正
  const envelope = {
    cachedAt: new Date().toISOString(),
    response: data,
  };

  await storage.put(key, JSON.stringify(envelope), { customMetadata: {
    "stats-data-id": params.statsDataId,
    "saved-at": envelope.cachedAt,
    "table-title": metadata,
  } });

  logger.info(
    { key, size: JSON.stringify(envelope).length }, // sizeの計算方法を修正
    `R2統計データキャッシュ保存完了: ${key} (${JSON.stringify(envelope).length}バイト)`
  );
}
