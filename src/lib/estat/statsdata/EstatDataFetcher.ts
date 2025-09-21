import { estatAPI } from "@/services/estat-api";
import { EstatStatsDataResponse, EstatStatsListResponse } from "../types";

/**
 * e-STAT APIデータ取得クラス
 * APIからのデータ取得を担当
 */
export class EstatDataFetcher {
  /**
   * 統計データリストを取得
   */
  static async getStatsList(
    options: {
      searchWord?: string;
      searchKind?: string;
      startPosition?: number;
      limit?: number;
    } = {}
  ): Promise<EstatStatsListResponse> {
    try {
      const response = await estatAPI.getStatsList({
        searchKind: "1",
        startPosition: 1,
        limit: 20,
        ...options,
      });

      return response;
    } catch (error) {
      console.error("Failed to fetch stats list:", error);
      throw new Error(
        `統計データリストの取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 統計データを取得
   */
  static async getStatsData(
    statsDataId: string,
    options: {
      categoryFilter?: string;
      yearFilter?: string;
      limit?: number;
    } = {}
  ): Promise<EstatStatsDataResponse> {
    try {
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
      });

      return response;
    } catch (error) {
      console.error("Failed to fetch stats data:", error);
      throw new Error(
        `統計データの取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
