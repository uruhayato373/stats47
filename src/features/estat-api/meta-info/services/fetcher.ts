/**
 * e-STATメタ情報取得ユーティリティ
 * 責務: API通信とエラーハンドリング
 */

import { estatAPI } from "@/features/estat-api/core/client";
import { EstatMetaInfoFetchError } from "@/features/estat-api/core/errors";
import {
  EstatMetaInfoResponse,
  TransformedMetadataEntry,
} from "@/features/estat-api/core/types";

import { extractCategories } from "./formatter";

/**
 * APIからメタ情報を取得
 *
 * @param statsDataId - 統計表ID
 * @returns メタ情報のAPIレスポンス
 * @throws {Error} API呼び出しが失敗した場合
 */
export async function fetchMetaInfo(
  statsDataId: string
): Promise<EstatMetaInfoResponse> {
  try {
    const response = await estatAPI.getMetaInfo({ statsDataId });
    return response;
  } catch (error) {
    throw new EstatMetaInfoFetchError(
      `メタ情報の取得に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      statsDataId,
      error
    );
  }
}

/**
 * メタ情報を取得して変換（便利メソッド）
 *
 * @param statsDataId - 統計表ID
 * @returns 変換されたメタデータエントリの配列
 */
export async function fetchAndTransformMetaInfo(
  statsDataId: string
): Promise<TransformedMetadataEntry[]> {
  const response = await fetchMetaInfo(statsDataId);
  return extractCategories(response).map((category) => ({
    stats_data_id: statsDataId,
    stat_name: response.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME?.$ || "",
    title: response.GET_META_INFO.METADATA_INF.TABLE_INF.TITLE?.$ || "",
    cat01: category.id,
    item_name: category.name,
    unit: null,
  }));
}
