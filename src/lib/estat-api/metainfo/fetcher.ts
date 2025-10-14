/**
 * e-STATメタ情報取得クラス
 * 責務: API通信とエラーハンドリング
 */

import { estatAPI } from "../client";
import { EstatMetaInfoResponse, TransformedMetadataEntry } from "../types";
import { EstatMetaInfoFormatter } from "./formatter";

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
      console.log(`🔵 Fetcher: メタ情報取得開始 - ${statsDataId}`);
      const startTime = Date.now();

      const response = await estatAPI.getMetaInfo({ statsDataId });

      console.log(`✅ Fetcher: メタ情報取得完了 (${Date.now() - startTime}ms)`);
      return response;
    } catch (error) {
      console.error("❌ Fetcher: メタ情報取得失敗:", error);
      throw new Error(
        `メタ情報の取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
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
    return EstatMetaInfoFormatter.transformToCSVFormat(response);
  }
}
