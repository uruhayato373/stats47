import { logger } from "@stats47/logger";
import { R2Bucket } from "@stats47/r2-storage";

import type { EstatStatsDataResponse, GetStatsDataParams } from '../../types';
import { isStale } from './envelope';
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

    // ★鮮度上限を超えたキャッシュは miss 扱いにして再取得・上書きさせる。
    //   統計表は年次更新されるため、無期限キャッシュだと新年度データが永久に反映されない。
    //   cachedAt 欠落・不正も stale とする (v1 以前の壊れた封筒を通さない)。
    if (isStale(parsed?.cachedAt)) {
      logger.debug({ key, cachedAt: parsed?.cachedAt }, "R2統計データキャッシュ期限切れ");
      return null;
    }

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
