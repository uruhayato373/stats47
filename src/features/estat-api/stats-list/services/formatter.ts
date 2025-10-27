/**
 * e-Stat統計表リストフォーマッター
 * 責務: データ構造の変換のみを担当（純粋関数）
 */

import {
  EstatStatsListResponse,
  EstatTableListItem,
} from "@/features/estat-api/core/types";
import {
  DetailedStatsListTableInfo,
  StatsListSearchResult,
  StatsListTableInfo,
} from "../../types";

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
    console.log("🔵 Formatter: レスポンス:", response);
    const startTime = Date.now();

    const datalist = response.GET_STATS_LIST.DATALIST_INF;
    console.log("🔵 Formatter: DATALIST_INF:", datalist);
    const tables = datalist.LIST_INF?.TABLE_INF;
    console.log("🔵 Formatter: TABLE_INF:", tables);

    if (!tables) {
      console.log("⚠️ Formatter: テーブル情報が見つかりません");
      return {
        totalCount: datalist.NUMBER || 0,
        tables: [],
        pagination: {
          fromNumber: 0,
          toNumber: 0,
        },
      };
    }

    const tableArray = Array.isArray(tables) ? tables : [tables];
    console.log(`🔵 Formatter: テーブル数: ${tableArray.length}`);
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
    console.log("🔵 Formatter: 結果:", result);
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

  /**
   * 詳細な統計表情報を整形
   *
   * @param tableInfo - 統計表情報
   * @returns 詳細な統計表情報
   */
  static formatDetailedTableInfo(
    tableInfo: EstatTableListItem
  ): DetailedStatsListTableInfo {
    const basic = this.formatTableInfo(tableInfo);

    return {
      ...basic,
      collectArea: tableInfo.COLLECT_AREA as "1" | "2" | "3" | undefined,
      description: tableInfo.DESCRIPTION,
      statisticsNameSpec: tableInfo.STATISTICS_NAME_SPEC
        ? {
            tabulationCategory:
              tableInfo.STATISTICS_NAME_SPEC.TABULATION_CATEGORY,
            tabulationSubCategory1:
              tableInfo.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY1,
            tabulationSubCategory2:
              tableInfo.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY2,
            tabulationSubCategory3:
              tableInfo.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY3,
            tabulationSubCategory4:
              tableInfo.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY4,
            tabulationSubCategory5:
              tableInfo.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY5,
          }
        : undefined,
    };
  }

  /**
   * 検索結果をソート
   *
   * @param tables - 統計表情報配列
   * @param sortBy - ソート基準
   * @param order - ソート順序
   * @returns ソートされた統計表情報配列
   */
  static sortResults(
    tables: StatsListTableInfo[],
    sortBy: "surveyDate" | "openDate" | "updatedDate" | "statName",
    order: "asc" | "desc" = "desc"
  ): StatsListTableInfo[] {
    return [...tables].sort((a, b) => {
      let aVal: string | undefined, bVal: string | undefined;

      switch (sortBy) {
        case "surveyDate":
          aVal = a.surveyDate;
          bVal = b.surveyDate;
          break;
        case "openDate":
          aVal = a.openDate;
          bVal = b.openDate;
          break;
        case "updatedDate":
          aVal = a.updatedDate;
          bVal = b.updatedDate;
          break;
        case "statName":
          aVal = a.statName;
          bVal = b.statName;
          break;
      }

      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;

      const comparison = aVal.localeCompare(bVal);
      return order === "asc" ? comparison : -comparison;
    });
  }

  /**
   * 検索結果をフィルタリング
   *
   * @param tables - 統計表情報配列
   * @param filters - フィルタ条件
   * @returns フィルタされた統計表情報配列
   */
  static filterResults(
    tables: StatsListTableInfo[],
    filters: {
      cycleFilter?: string[];
      dateRange?: { from?: string; to?: string };
    }
  ): StatsListTableInfo[] {
    return tables.filter((table) => {
      // 周期フィルタ
      if (filters.cycleFilter && filters.cycleFilter.length > 0) {
        if (!table.cycle || !filters.cycleFilter.includes(table.cycle)) {
          return false;
        }
      }

      // 日付範囲フィルタ
      if (filters.dateRange) {
        const surveyDate = table.surveyDate;
        if (surveyDate) {
          if (filters.dateRange.from && surveyDate < filters.dateRange.from) {
            return false;
          }
          if (filters.dateRange.to && surveyDate > filters.dateRange.to) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * 統計表を機関別にグループ化
   *
   * @param tables - 統計表情報配列
   * @returns 機関別にグループ化された統計表
   */
  static groupByOrganization(
    tables: StatsListTableInfo[]
  ): Record<string, StatsListTableInfo[]> {
    return tables.reduce((acc, table) => {
      const org = table.govOrg || "不明";

      if (!acc[org]) {
        acc[org] = [];
      }
      acc[org].push(table);

      return acc;
    }, {} as Record<string, StatsListTableInfo[]>);
  }

  /**
   * 統計表を周期別にグループ化
   *
   * @param tables - 統計表情報配列
   * @returns 周期別にグループ化された統計表
   */
  static groupByCycle(
    tables: StatsListTableInfo[]
  ): Record<string, StatsListTableInfo[]> {
    return tables.reduce((acc, table) => {
      const cycle = table.cycle || "不明";

      if (!acc[cycle]) {
        acc[cycle] = [];
      }
      acc[cycle].push(table);

      return acc;
    }, {} as Record<string, StatsListTableInfo[]>);
  }
}
