import { EstatStatsDataResponse, EstatValue } from "../types";
import {
  FormattedArea,
  FormattedCategory,
  FormattedYear,
  FormattedValue,
  FormattedEstatData,
} from "../types/formatted";

/**
 * e-STAT統計データフォーマッター
 * 責務: データ構造の変換のみを担当（純粋関数）
 */
export class EstatStatsDataFormatter {
  /**
   * 統計データレスポンスを整形
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

    // テーブル情報
    const tableInfo = {
      id: data.TABLE_INF?.["@id"] || "",
      title: data.TABLE_INF?.TITLE?.$ || "",
      statName: data.TABLE_INF?.STAT_NAME?.$ || "",
      govOrg: data.TABLE_INF?.GOV_ORG?.$ || "",
      statisticsName: data.TABLE_INF?.STATISTICS_NAME || "",
      totalNumber: parseInt(data.TABLE_INF?.TOTAL_NUMBER || "0"),
      fromNumber: parseInt(data.TABLE_INF?.FROM_NUMBER || "0"),
      toNumber: parseInt(data.TABLE_INF?.TO_NUMBER || "0"),
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

    const result = {
      tableInfo,
      areas,
      categories,
      years,
      values,
      metadata: {
        processedAt: new Date().toISOString(),
        totalRecords: values.length,
        validValues: values.filter(
          (v) => v.value !== null && v.value !== undefined
        ).length,
        nullValues: values.filter(
          (v) => v.value === null || v.value === undefined
        ).length,
      },
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
  static formatAreas(classInfo: any[]): FormattedArea[] {
    const areaClass = classInfo.find((cls) => cls["@id"] === "area");
    if (!areaClass?.CLASS) return [];

    const areas = Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS
      : [areaClass.CLASS];

    return areas.map((area: any) => ({
      areaCode: area["@code"] || "",
      areaName: area["@name"] || "",
      level: area["@level"] || "1",
      parentCode: area["@parentCode"] || undefined,
    }));
  }

  /**
   * カテゴリ情報を整形
   *
   * @param classInfo - クラス情報配列
   * @returns 整形されたカテゴリ情報配列
   */
  static formatCategories(classInfo: any[]): FormattedCategory[] {
    const categoryClass = classInfo.find((cls) => cls["@id"] === "cat01");
    if (!categoryClass?.CLASS) return [];

    const categories = Array.isArray(categoryClass.CLASS)
      ? categoryClass.CLASS
      : [categoryClass.CLASS];

    return categories.map((category: any) => ({
      categoryCode: category["@code"] || "",
      categoryName: category["@name"] || "",
      displayName: category["@name"] || "",
      unit: category["@unit"] || null,
    }));
  }

  /**
   * 年次情報を整形
   *
   * @param classInfo - クラス情報配列
   * @returns 整形された年次情報配列
   */
  static formatYears(classInfo: any[]): FormattedYear[] {
    const timeClass = classInfo.find((cls) => cls["@id"] === "time");
    if (!timeClass?.CLASS) return [];

    const years = Array.isArray(timeClass.CLASS)
      ? timeClass.CLASS
      : [timeClass.CLASS];

    return years.map((year: any) => ({
      timeCode: year["@code"] || "",
      timeName: year["@name"] || "",
    }));
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
