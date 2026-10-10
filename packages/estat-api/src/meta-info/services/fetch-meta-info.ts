import { logger } from "@stats47/logger";
import type { R2Bucket } from "@stats47/r2-storage";
import { EstatMetaInfoFetchError } from "../errors";
import { fetchMetaInfoFromApi } from "../repositories/api/fetch-from-api";
import { findMetaInfoCache } from "../repositories/cache/find-cache";
import { saveMetaInfoCache } from "../repositories/cache/save-cache";
import type { EstatMetaInfoResponse } from "../types";

/**
 * メタ情報を取得（キャッシュ優先）
 *
 * @param statsDataId - 統計表ID
 * @param storage - R2ストレージ（オプション）。渡したときだけキャッシュへ保存する
 */
export async function fetchMetaInfo(
  statsDataId: string,
  storage?: R2Bucket
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

    // 3. キャッシュ保存
    //    stats-data と同じく await する (fire-and-forget は Workers でレスポンス確定後に中断されうる)。
    //    保存失敗はデータ取得の失敗ではないので、ログに残して続行する。
    if (storage) {
      try {
        await saveMetaInfoCache(storage, statsDataId, data);
      } catch (err) {
        logger.warn({ statsDataId, error: err }, "キャッシュ保存失敗");
      }
    }

    return data;
  } catch (error) {
    throw new EstatMetaInfoFetchError(
      "メタ情報の取得に失敗しました",
      statsDataId,
      error
    );
  }
}
