import { estatAPI } from "@/features/estat-api/core/client";
import {
  EstatStatsDataResponse,
  FetchOptions,
} from "@/features/estat-api/core/types";
import { FormattedEstatData } from "@/features/estat-api/core/types/stats-data";

import { EstatStatsDataFormatter } from "./formatter";

/**
 * e-STAT統計データ取得クラス
 * 責務: API通信とエラーハンドリング
 */
export class EstatStatsDataFetcher {
  /**
   * 統計データを取得（生データ）
   *
   * @param statsDataId - 統計表ID
   * @param options - 取得オプション
   * @returns 統計データのAPIレスポンス
   * @throws {Error} API呼び出しが失敗した場合
   */
  static async fetchStatsData(
    statsDataId: string,
    options: FetchOptions = {}
  ): Promise<EstatStatsDataResponse> {
    try {
      console.log(`🔵 Fetcher: 統計データ取得開始 - ${statsDataId}`);
      const startTime = Date.now();

      const response = await estatAPI.getStatsData({
        statsDataId,
        metaGetFlg: "Y",
        cntGetFlg: "N",
        explanationGetFlg: "N",
        annotationGetFlg: "N",
        replaceSpChars: "0",
        startPosition: 1,
        limit: options.limit || 10000,
        ...(options.categoryFilter && { cdCat01: options.categoryFilter }),
        ...(options.yearFilter && { cdTime: options.yearFilter }),
        ...(options.areaFilter && { cdArea: options.areaFilter }),
      });

      console.log(
        `✅ Fetcher: 統計データ取得完了 (${Date.now() - startTime}ms)`
      );
      return response;
    } catch (error) {
      console.error("❌ Fetcher: 統計データ取得失敗:", error);
      console.error("Error details:", {
        statsDataId,
        options,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `統計データの取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 統計データを取得して整形（便利メソッド）
   *
   * @param statsDataId - 統計表ID
   * @param options - 取得オプション
   * @returns 整形された統計データ
   */
  static async fetchAndFormat(
    statsDataId: string,
    options: FetchOptions = {}
  ): Promise<FormattedEstatData> {
    const response = await this.fetchStatsData(statsDataId, options);
    return EstatStatsDataFormatter.formatStatsData(response);
  }
}
