import { EstatTableInfo, FormattedTableInfo } from "../types";

/**
 * テーブル情報を整形
 *
 * e-Stat APIのTABLE_INFから構造化されたFormattedTableInfoに変換する。
 * 基本情報、日付、分類、統計名仕様などを含む。
 *
 * @param tableInf - e-Stat APIのTABLE_INF
 * @returns 整形されたテーブル情報
 */
export function formatTableInfo(tableInf: EstatTableInfo): FormattedTableInfo {
  return {
    // 基本情報
    id: tableInf?.["@id"] || "",
    title: tableInf?.TITLE?.$ || "",
    statName: tableInf?.STAT_NAME?.$ || "",
    statCode:
      (tableInf?.STAT_NAME as { "@code"?: string } | undefined)?.["@code"] ||
      "",
    govOrg: tableInf?.GOV_ORG?.$ || "",
    govOrgCode:
      (tableInf?.GOV_ORG as { "@code"?: string } | undefined)?.["@code"] || "",
    statisticsName: tableInf?.STATISTICS_NAME || "",

    // データ範囲
    totalNumber: parseInt(tableInf?.TOTAL_NUMBER || "0"),
    fromNumber: parseInt(tableInf?.FROM_NUMBER || "0"),
    toNumber: parseInt(tableInf?.TO_NUMBER || "0"),

    // 追加: 日付情報（ネスト）
    dates: {
      surveyDate: tableInf?.SURVEY_DATE || 0,
      openDate: tableInf?.OPEN_DATE || "",
      updatedDate: tableInf?.UPDATED_DATE || "",
    },

    // 追加: データ特性（ネスト）
    characteristics: {
      cycle: tableInf?.CYCLE || "",
      smallArea: parseInt(tableInf?.SMALL_AREA || "0"),
      collectArea: tableInf?.COLLECT_AREA || "",
    },

    // 分類情報
    classification: {
      mainCategory: {
        code:
          (tableInf?.MAIN_CATEGORY as { "@code"?: string } | undefined)?.[
            "@code"
          ] || "",
        name: tableInf?.MAIN_CATEGORY?.$ || "",
      },
      subCategory: tableInf?.SUB_CATEGORY
        ? {
            code:
              (tableInf.SUB_CATEGORY as { "@code"?: string })?.["@code"] || "",
            name: tableInf.SUB_CATEGORY.$ || "",
          }
        : undefined,
    },

    // 統計名仕様
    statisticsNameSpec: tableInf?.STATISTICS_NAME_SPEC
      ? {
          tabulationCategory:
            tableInf.STATISTICS_NAME_SPEC.TABULATION_CATEGORY || "",
          tabulationSubCategory1:
            tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY1,
          tabulationSubCategory2:
            tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY2,
          tabulationSubCategory3:
            tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY3,
        }
      : undefined,

    // 説明
    description: tableInf.DESCRIPTION
      ? {
          tabulationCategoryExplanation:
            tableInf.DESCRIPTION.TABULATION_CATEGORY_EXPLANATION,
          general: tableInf.DESCRIPTION.$,
        }
      : undefined,
  };
}
