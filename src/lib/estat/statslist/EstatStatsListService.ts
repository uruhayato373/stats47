import { estatAPI } from "@/services/estat-api";
import { EstatStatsListResponse } from "../types";
import { FormattedStatListItem } from "../types";

/**
 * e-STAT統計データリストサービスクラス
 * 統計データリストの取得・整形を担当
 */
export class EstatStatsListService {
  /**
   * 統計データリストを取得して整形
   */
  static async getAndFormatStatsList(
    options: {
      searchWord?: string;
      searchKind?: "1" | "2" | "3";
      startPosition?: number;
      limit?: number;
    } = {}
  ): Promise<FormattedStatListItem[]> {
    const response = await this.getStatsListRaw(options);
    return this.formatStatsList(response);
  }

  /**
   * 統計データリストを取得（生データ）
   */
  static async getStatsListRaw(
    options: {
      searchWord?: string;
      searchKind?: "1" | "2" | "3";
      startPosition?: number;
      limit?: number;
    } = {}
  ): Promise<EstatStatsListResponse> {
    try {
      const response = await estatAPI.getStatsList({
        searchKind: "1" as "1" | "2" | "3",
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
   * 統計データリストレスポンスを整形
   */
  static formatStatsList(
    response: EstatStatsListResponse
  ): FormattedStatListItem[] {
    const tables =
      response.GET_STATS_LIST?.DATALIST_INF?.LIST_INF?.TABLE_INF || [];

    // 配列でない場合は配列に変換
    const tableArray = Array.isArray(tables) ? tables : [tables];

    return tableArray.map((table) => ({
      id: table["@id"],
      statName: table.STAT_NAME?.$?.trim() || "",
      title: table.TITLE?.$?.trim() || "",
      govOrg: table.GOV_ORG?.$?.trim() || "",
      statisticsName: table.STATISTICS_NAME?.trim() || "",
      surveyDate: table.SURVEY_DATE || "",
      updatedDate: table.UPDATED_DATE || "",
      description: undefined,
    }));
  }

  /**
   * 文字列をクリーンアップ
   */
  private static cleanString(str: string): string {
    return str
      .replace(/\s+/g, " ")
      .replace(/[　\s]+/g, " ")
      .trim();
  }
}
