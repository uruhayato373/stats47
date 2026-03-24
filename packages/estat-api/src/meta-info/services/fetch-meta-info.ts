import { logger } from "@stats47/logger";
import { EstatMetaInfoFetchError } from "../errors";
import { fetchMetaInfoFromApi } from "../repositories/api/fetch-from-api";
import { findMetaInfoCache } from "../repositories/cache/find-cache";
import { saveMetaInfoCache } from "../repositories/cache/save-cache";
import type { EstatMetaInfoResponse } from "../types";

/**
 * メタ情報を取得（キャッシュ優先）
 */
export async function fetchMetaInfo(
  statsDataId: string
): Promise<EstatMetaInfoResponse> {
  // 1. キャッシュ確認
  try {
    const cached = await findMetaInfoCache(statsDataId);
    if (cached) {
      return cached;
    }
  } catch (error) {
    logger.warn({ statsDataId, error }, "キャッシュ取得エラー");
  }

  // 2. API取得
  try {
    const data = await fetchMetaInfoFromApi(statsDataId);

    // 3. キャッシュ保存（非同期）
    // void演算子でPromiseを無視することを明示
    void saveMetaInfoCache(statsDataId, data).catch((err) =>
      logger.warn({ statsDataId, error: err }, "キャッシュ保存失敗")
    );

    return data;
  } catch (error) {
    throw new EstatMetaInfoFetchError(
      "メタ情報の取得に失敗しました",
      statsDataId,
      error
    );
  }
}
