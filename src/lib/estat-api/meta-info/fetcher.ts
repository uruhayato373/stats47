/**
 * e-STATメタ情報取得クラス
 * 責務: API通信とエラーハンドリング
 */

import { estatAPI } from "../client";
import { EstatMetaInfoResponse, TransformedMetadataEntry } from "../types";
import { EstatMetaInfoFormatter } from "./formatter";
import { EstatMetaInfoFetchError } from "../errors";

export class EstatMetaInfoFetcher {
  /**
   * APIからメタ情報を取得
   *
   * @param statsDataId - 統計表ID
   * @returns メタ情報のAPIレスポンス
   * @throws {Error} API呼び出しが失敗した場合
   */
  static async fetchMetaInfo(
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
  static async fetchAndTransform(
    statsDataId: string
  ): Promise<TransformedMetadataEntry[]> {
    const response = await this.fetchMetaInfo(statsDataId);
    return EstatMetaInfoFormatter.extractCategories(response).map(
      (category) => ({
        stats_data_id: statsDataId,
        stat_name:
          response.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME?.$ || "",
        title: response.GET_META_INFO.METADATA_INF.TABLE_INF.TITLE?.$ || "",
        cat01: category.id,
        item_name: category.name,
        unit: null,
      })
    );
  }
}
