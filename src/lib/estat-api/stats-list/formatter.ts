/**
 * e-Stat統計表リストフォーマッター
 * 責務: データ構造の変換のみを担当（純粋関数）
 */

import { EstatStatsListResponse, EstatTableListItem } from "../types";
import { StatsListSearchResult, StatsListTableInfo } from "../types/stats-list";

/**
 * e-Stat統計表リストフォーマッター
 * 責務: データ構造の変換のみを担当（純粋関数）
 */
export class EstatStatsListFormatter {
  /**
   * 統計表リストレスポンスを整形
   *
   * @param response - e-Stat APIの統計表リストレスポンス
   * @returns 整形された検索結果
   */
  static formatStatsListData(
    response: EstatStatsListResponse
  ): StatsListSearchResult {
    console.log("🔵 Formatter: formatStatsListData 開始");
    const startTime = Date.now();

    const datalist = response.GET_STATS_LIST.DATALIST_INF;
    const tables = datalist.LIST_INF?.TABLE_INF;

    if (!tables) {
      return {
        totalCount: 0,
        tables: [],
        pagination: {
          fromNumber: 0,
          toNumber: 0,
        },
      };
    }

    const tableArray = Array.isArray(tables) ? tables : [tables];
    const formattedTables = tableArray.map((table) =>
      this.formatTableInfo(table)
    );

    const result = {
      totalCount: datalist.NUMBER,
      tables: formattedTables,
      pagination: {
        fromNumber: datalist.RESULT_INF?.FROM_NUMBER || 1,
        toNumber: datalist.RESULT_INF?.TO_NUMBER || formattedTables.length,
        nextKey: datalist.RESULT_INF?.NEXT_KEY,
      },
    };

    console.log(
      `✅ Formatter: formatStatsListData 完了 (${Date.now() - startTime}ms) - ${
        formattedTables.length
      }件`
    );
    return result;
  }

  /**
   * 統計表情報を整形
   *
   * @param tableInfo - 統計表情報
   * @returns 整形された統計表情報
   */
  static formatTableInfo(tableInfo: EstatTableListItem): StatsListTableInfo {
    return {
      id: tableInfo["@id"],
      statName: tableInfo.STAT_NAME?.$ || "",
      govOrg: tableInfo.GOV_ORG?.$ || "",
      statisticsName: tableInfo.STATISTICS_NAME || "",
      title: tableInfo.TITLE?.$ || "",
      cycle: tableInfo.CYCLE,
      surveyDate: tableInfo.SURVEY_DATE,
      openDate: tableInfo.OPEN_DATE,
      smallArea: tableInfo.SMALL_AREA,
      totalNumber: tableInfo.OVERALL_TOTAL_NUMBER,
      updatedDate: tableInfo.UPDATED_DATE,
      mainCategory: tableInfo.MAIN_CATEGORY
        ? {
            code: (tableInfo.MAIN_CATEGORY as any)["@code"] || "",
            name: tableInfo.MAIN_CATEGORY.$ || "",
          }
        : undefined,
      subCategory: tableInfo.SUB_CATEGORY
        ? {
            code: (tableInfo.SUB_CATEGORY as any)["@code"] || "",
            name: tableInfo.SUB_CATEGORY.$ || "",
          }
        : undefined,
    };
  }

  /**
   * メタデータを抽出
   *
   * @param response - e-Stat APIの統計表リストレスポンス
   * @returns 抽出されたメタデータ
   */
  static extractMetadata(response: EstatStatsListResponse) {
    const result = response.GET_STATS_LIST.RESULT;
    const datalist = response.GET_STATS_LIST.DATALIST_INF;

    return {
      status: result.STATUS,
      errorMessage: result.ERROR_MSG,
      date: result.DATE,
      totalCount: datalist.NUMBER,
      fromNumber: datalist.RESULT_INF?.FROM_NUMBER || 0,
      toNumber: datalist.RESULT_INF?.TO_NUMBER || 0,
      nextKey: datalist.RESULT_INF?.NEXT_KEY,
    };
  }

  /**
   * 統計表を分野別にグループ化
   *
   * @param tables - 統計表情報配列
   * @returns 分野別にグループ化された統計表
   */
  static groupByField(
    tables: StatsListTableInfo[]
  ): Record<string, StatsListTableInfo[]> {
    return tables.reduce((acc, table) => {
      const fieldCode = table.mainCategory?.code || "99"; // 未分類は99
      const fieldName = table.mainCategory?.name || "その他";
      const key = `${fieldCode}-${fieldName}`;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(table);

      return acc;
    }, {} as Record<string, StatsListTableInfo[]>);
  }

  /**
   * 統計表を年次別にグループ化
   *
   * @param tables - 統計表情報配列
   * @returns 年次別にグループ化された統計表
   */
  static groupByYear(
    tables: StatsListTableInfo[]
  ): Record<string, StatsListTableInfo[]> {
    return tables.reduce((acc, table) => {
      const year = table.surveyDate ? table.surveyDate.substring(0, 4) : "不明";

      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(table);

      return acc;
    }, {} as Record<string, StatsListTableInfo[]>);
  }
}
