import { logger } from '@stats47/logger';
import { R2Bucket } from '@stats47/r2-storage';
import { fetchStatsDataFromApi } from '../repositories/api/fetch-from-api';
import { findStatsDataCache } from '../repositories/cache/find-cache';
import { saveStatsDataCache } from '../repositories/cache/save-cache';
import type { EstatStatsDataResponse, FetchStatsDataResult, GetStatsDataParams } from '../types';

/**
 * 統計データを取得する（キャッシュ優先）
 *
 * @param params - e-Stat APIパラメータ
 * @param storage - R2ストレージ（オプション）
 */
export async function fetchStatsData(
  params: GetStatsDataParams,
  storage?: R2Bucket
): Promise<FetchStatsDataResult> {
  // 1. キャッシュを確認
  if (storage) {
    const cached = await tryFindCache(storage, params);
    if (cached) {
      return { data: cached, source: 'r2' };
    }
  }

  // 2. APIから取得
  const data = await fetchStatsDataFromApi(params);

  // 3. キャッシュに保存
  //    ★await する。fire-and-forget は Workers ではレスポンス確定後に中断されうるため
  //      「保存したつもりで保存されていない」状態を作る (キャッシュが永久に温まらない)。
  //      保存失敗はデータ取得の失敗ではないので、握り潰さずログに残して続行する。
  if (storage) {
    try {
      await saveStatsDataCache(storage, params, data);
    } catch (error) {
      logger.warn(
        {
          statsDataId: params.statsDataId,
          error: error instanceof Error ? error.message : String(error),
        },
        "R2統計データキャッシュ保存に失敗しました (取得自体は成功)"
      );
    }
  }

  return { data, source: 'api' };
}

async function tryFindCache(
  storage: R2Bucket,
  params: GetStatsDataParams
): Promise<EstatStatsDataResponse | null> {
  try {
    return await findStatsDataCache(storage, params);
  } catch {
    return null;
  }
}
