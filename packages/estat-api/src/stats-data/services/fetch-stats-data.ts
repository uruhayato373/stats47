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

  // 3. キャッシュに保存（非同期・エラー無視）
  if (storage) {
    saveStatsDataCache(storage, params, data).catch(() => {});
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
