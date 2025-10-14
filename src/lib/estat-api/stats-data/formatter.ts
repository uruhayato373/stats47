import { EstatStatsDataResponse, EstatValue } from "../types";
import {
  FormattedArea,
  FormattedCategory,
  FormattedYear,
  FormattedValue,
  FormattedEstatData,
  FormattedTableInfo,
  FormattedMetadata,
  DataNote,
} from "../types/stats-data";

/**
 * e-STAT統計データフォーマッター
 * 責務: データ構造の変換のみを担当（純粋関数）
 */
export class EstatStatsDataFormatter {
  /**
   * 統計データレスポンスを整形（拡張版）
   *
   * @param response - e-Stat APIの統計データレスポンス
   * @returns 整形された統計データ
   * @throws {Error} 統計データが見つからない場合
   */
  static formatStatsData(response: EstatStatsDataResponse): FormattedEstatData {
    console.log("🔵 Formatter: formatStatsData 開始");
    const startTime = Date.now();

    const data = response.GET_STATS_DATA?.STATISTICAL_DATA;
    if (!data) {
      throw new Error("統計データが見つかりません");
    }

    const tableInf = data.TABLE_INF;

    // 拡張版テーブル情報
    const tableInfo: FormattedTableInfo = {
      // 基本情報
      id: tableInf?.["@id"] || "",
      title: tableInf?.TITLE?.$ || "",
      statName: tableInf?.STAT_NAME?.$ || "",
      statCode: (tableInf?.STAT_NAME as any)?.["@code"] || "",
      govOrg: tableInf?.GOV_ORG?.$ || "",
      govOrgCode: (tableInf?.GOV_ORG as any)?.["@code"] || "",
      statisticsName: tableInf?.STATISTICS_NAME || "",

      // データ範囲
      totalNumber: parseInt(tableInf?.TOTAL_NUMBER || "0"),
      fromNumber: parseInt(tableInf?.FROM_NUMBER || "0"),
      toNumber: parseInt(tableInf?.TO_NUMBER || "0"),

      // 日付情報
      dates: {
        surveyDate: tableInf?.SURVEY_DATE || 0,
        openDate: tableInf?.OPEN_DATE || "",
        updatedDate: tableInf?.UPDATED_DATE || "",
      },

      // データ特性
      characteristics: {
        cycle: tableInf?.CYCLE || "",
        smallArea: parseInt(tableInf?.SMALL_AREA || "0"),
        collectArea: tableInf?.COLLECT_AREA || "",
      },

      // 分類情報
      classification: {
        mainCategory: {
          code: (tableInf?.MAIN_CATEGORY as any)?.["@code"] || "",
          name: tableInf?.MAIN_CATEGORY?.$ || "",
        },
        subCategory: tableInf?.SUB_CATEGORY
          ? {
              code: (tableInf.SUB_CATEGORY as any)?.["@code"] || "",
              name: tableInf.SUB_CATEGORY.$ || "",
            }
          : undefined,
      },

      // 提供統計名詳細
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
      description: (tableInf as any)?.DESCRIPTION
        ? {
            tabulationCategoryExplanation: (tableInf as any).DESCRIPTION
              .TABULATION_CATEGORY_EXPLANATION,
            general: (tableInf as any).DESCRIPTION.$,
          }
        : undefined,
    };

    // クラス情報
    const classInfo = data.CLASS_INF?.CLASS_OBJ || [];
    const areas = this.formatAreas(classInfo);
    const categories = this.formatCategories(classInfo);
    const years = this.formatYears(classInfo);

    // データ値
    const rawValues = data.DATA_INF?.VALUE || [];
    const valuesArray = Array.isArray(rawValues) ? rawValues : [rawValues];
    const values = this.formatValues(valuesArray, areas, categories, years);

    // 注記情報
    const notes: DataNote[] = data.DATA_INF?.NOTE
      ? (Array.isArray(data.DATA_INF.NOTE)
          ? data.DATA_INF.NOTE
          : [data.DATA_INF.NOTE]
        ).map((note) => ({
          char: note["@char"] || "",
          description: note.$ || "",
        }))
      : [];

    // 拡張メタデータ計算
    const validValues = values.filter(
      (v) => v.value !== null && v.value !== undefined
    ).length;
    const nullValues = values.length - validValues;
    const nullPercentage =
      values.length > 0 ? (nullValues / values.length) * 100 : 0;

    // 年度範囲
    const yearCodes = years.map((y) => y.timeCode).sort();
    const yearRange =
      yearCodes.length > 0
        ? {
            min: yearCodes[0],
            max: yearCodes[yearCodes.length - 1],
            count: yearCodes.length,
          }
        : undefined;

    // 地域範囲
    const prefectures = areas.filter(
      (a) => a.level === "2" && a.areaCode !== "00000"
    );
    const hasNational = areas.some((a) => a.areaCode === "00000");
    const areaRange = {
      count: areas.length,
      prefectureCount: prefectures.length,
      hasNational,
    };

    // カテゴリ範囲
    const categoryRange = {
      count: categories.length,
    };

    // 完全性スコア計算（簡易版）
    const completenessScore = Math.round(
      (validValues / values.length) * 100 || 0
    );

    const metadata: FormattedMetadata = {
      processedAt: new Date().toISOString(),
      dataSource: "e-stat",

      stats: {
        totalRecords: values.length,
        validValues,
        nullValues,
        nullPercentage: Math.round(nullPercentage * 100) / 100,
      },

      range: yearRange
        ? {
            years: yearRange,
            areas: areaRange,
            categories: categoryRange,
          }
        : undefined,

      quality: {
        completenessScore,
        lastVerified: new Date().toISOString(),
      },
    };

    const result: FormattedEstatData = {
      tableInfo,
      areas,
      categories,
      years,
      values,
      metadata,
      notes,
    };

    console.log(
      `✅ Formatter: formatStatsData 完了 (${Date.now() - startTime}ms) - ${
        values.length
      }件の値`
    );
    return result;
  }

  /**
   * 地域情報を整形
   *
   * @param classInfo - クラス情報配列
   * @returns 整形された地域情報配列
   */
  static formatAreas(classInfo: unknown[]): FormattedArea[] {
    const areaClass = classInfo.find(
      (cls) => (cls as Record<string, unknown>)["@id"] === "area"
    ) as Record<string, unknown>;
    if (!areaClass?.CLASS) return [];

    const areas = Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS
      : [areaClass.CLASS];

    return areas.map((area: unknown) => {
      const areaObj = area as Record<string, unknown>;
      return {
        areaCode: (areaObj["@code"] as string) || "",
        areaName: (areaObj["@name"] as string) || "",
        level: (areaObj["@level"] as string) || "1",
        parentCode: (areaObj["@parentCode"] as string) || undefined,
      };
    });
  }

  /**
   * カテゴリ情報を整形
   *
   * @param classInfo - クラス情報配列
   * @returns 整形されたカテゴリ情報配列
   */
  static formatCategories(classInfo: unknown[]): FormattedCategory[] {
    const categoryClass = classInfo.find(
      (cls) => (cls as Record<string, unknown>)["@id"] === "cat01"
    ) as Record<string, unknown>;
    if (!categoryClass?.CLASS) return [];

    const categories = Array.isArray(categoryClass.CLASS)
      ? categoryClass.CLASS
      : [categoryClass.CLASS];

    return categories.map((category: unknown) => {
      const categoryObj = category as Record<string, unknown>;
      return {
        categoryCode: (categoryObj["@code"] as string) || "",
        categoryName: (categoryObj["@name"] as string) || "",
        displayName: (categoryObj["@name"] as string) || "",
        unit: (categoryObj["@unit"] as string) || null,
      };
    });
  }

  /**
   * 年次情報を整形
   *
   * @param classInfo - クラス情報配列
   * @returns 整形された年次情報配列
   */
  static formatYears(classInfo: unknown[]): FormattedYear[] {
    const timeClass = classInfo.find(
      (cls) => (cls as Record<string, unknown>)["@id"] === "time"
    ) as Record<string, unknown>;
    if (!timeClass?.CLASS) return [];

    const years = Array.isArray(timeClass.CLASS)
      ? timeClass.CLASS
      : [timeClass.CLASS];

    return years.map((year: unknown) => {
      const yearObj = year as Record<string, unknown>;
      return {
        timeCode: (yearObj["@code"] as string) || "",
        timeName: (yearObj["@name"] as string) || "",
      };
    });
  }

  /**
   * データ値を整形
   *
   * @param values - e-Stat APIの値配列
   * @param areas - 地域情報配列
   * @param categories - カテゴリ情報配列
   * @param years - 年次情報配列
   * @returns 整形された値配列
   */
  static formatValues(
    values: EstatValue[],
    areas: FormattedArea[],
    categories: FormattedCategory[],
    years: FormattedYear[]
  ): FormattedValue[] {
    return values.map((value) => {
      const numericValue = parseFloat(value.$ || "0");
      const areaCode = value["@area"] || "";
      const categoryCode = value["@cat01"] || "";
      const timeCode = value["@time"] || "";

      const area = areas.find((a) => a.areaCode === areaCode);
      const category = categories.find((c) => c.categoryCode === categoryCode);
      const year = years.find((y) => y.timeCode === timeCode);

      return {
        areaCode,
        areaName: area?.areaName || "",
        categoryCode,
        categoryName: category?.categoryName || "",
        timeCode,
        timeName: year?.timeName || "",
        value: numericValue || 0,
        unit: value["@unit"] || null,
      };
    });
  }
}
