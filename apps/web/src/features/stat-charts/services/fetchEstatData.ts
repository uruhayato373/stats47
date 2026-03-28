import { cache } from "react";

import {
  type GetStatsDataParams,
  fetchFormattedStats,
} from "@stats47/estat-api/server";
import { logger } from "@stats47/logger";

import { getEstatCacheStorage } from "./get-estat-cache-storage";

import type { StatsSchema } from "@stats47/types";

/**
 * 同一リクエスト内で同じパラメータの重複フェッチを防ぐ。
 * React.cache は同一レンダリングリクエスト内でのみメモ化される。
 * キーは JSON 文字列化したパラメータ。
 */
const cachedFetchFormattedStats = cache(
  async (paramsJson: string): Promise<StatsSchema[]> => {
    const params: GetStatsDataParams = JSON.parse(paramsJson);
    const storage = await getEstatCacheStorage();
    return fetchFormattedStats(params, storage);
  }
);

/**
 * e-Stat API から生データを取得する統一関数
 *
 * @param areaCode - 地域コード
 * @param estatParams - e-Stat API パラメータ
 * @returns 生データ（StatsSchema[]）またはエラー
 *
 * @remarks
 * - R2 キャッシュを利用（初回は API 取得→R2 保存、2回目以降は R2 から読み込み）
 * - React.cache でリクエスト内デデュプリケーション（同一パラメータの並列呼び出しを1回に集約）
 * - cdArea を付与せず全都道府県データを取得し、R2 キャッシュを47都道府県で共有する
 */
export async function fetchEstatData(
  areaCode: string,
  estatParams: GetStatsDataParams
): Promise<{ data: StatsSchema[] } | { error: string }> {
  try {
    // cdArea を付与せず全都道府県データを取得し、R2 キャッシュを共有する。
    // componentProps に cdArea が明示されている場合はそれを尊重する。
    const params: GetStatsDataParams = { ...estatParams };
    const paramsJson = JSON.stringify(params);

    const rawData = await cachedFetchFormattedStats(paramsJson);

    // cdArea なしで取得した場合、areaCode でフィルタリング
    const filtered = params.cdArea
      ? rawData
      : rawData.filter((d) => d.areaCode === areaCode);

    if (filtered.length === 0) {
      return { error: "データが見つかりません" };
    }

    return { data: filtered };
  } catch (err) {
    logger.warn(
      { error: err instanceof Error ? err.message : err, areaCode, estatParams },
      "e-Stat データ取得失敗"
    );
    return { error: "データの取得に失敗しました" };
  }
}

/**
 * 階層データ用に複数カテゴリを一度に取得
 *
 * @param areaCode - 地域コード
 * @param statsDataId - 統計表ID
 * @param categoryCodes - カテゴリコード配列（rootCode + childCodes）
 * @returns 生データ
 */
export async function fetchEstatDataWithCategories(
  areaCode: string,
  statsDataId: string,
  categoryCodes: string[]
): Promise<{ data: StatsSchema[] } | { error: string }> {
  return fetchEstatData(areaCode, {
    statsDataId,
    cdCat01: categoryCodes.join(","),
  });
}
