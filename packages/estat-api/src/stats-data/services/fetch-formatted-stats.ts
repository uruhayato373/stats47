import { R2Bucket } from '@stats47/r2-storage';
import type { StatsSchema } from '@stats47/types';
import type { GetStatsDataParams } from '../types';
import { convertToStatsSchema } from '../utils/convert-to-stats-schema';
import { formatStatsData } from '../utils/format-stats-data';
import { fetchStatsData } from './fetch-stats-data';

/**
 * 整形済み統計データを取得する
 *
 * @param params - e-Stat APIパラメータ
 * @param storage - R2ストレージ（オプション）
 * @throws Error データが取得できなかった場合
 */
export async function fetchFormattedStats(
  params: GetStatsDataParams,
  storage?: R2Bucket
): Promise<StatsSchema[]> {
  const { data } = await fetchStatsData(params, storage);
  const formatted = formatStatsData(data);

  const result = formatted.values
    .map(convertToStatsSchema)
    .filter((schema): schema is StatsSchema => schema !== undefined);

  if (result.length === 0) {
    throw new Error("e-Stat APIからデータが取得できませんでした");
  }

  return result;
}
