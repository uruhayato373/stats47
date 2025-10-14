import { estatAPI } from "../client";
import {
  EstatStatsDataResponse,
  EstatStatisticalData,
  EstatValue,
} from "../types";
import {
  FormattedArea,
  FormattedCategory,
  FormattedYear,
  FormattedValue,
  FormattedEstatData,
} from "../types/formatted";
import { EstatMetaCategoryData } from "../types";

/**
 * e-STAT統計データフォーマッター
 * 統計データの取得、整形、CSV変換を担当
 */
export class EstatStatsDataFormatter {
  /**
   * 統計データを取得して整形
   */
  static async getAndFormatStatsData(
    statsDataId: string,
    options: {
      categoryFilter?: string;
      yearFilter?: string;
      areaFilter?: string;
      limit?: number;
    } = {}
  ): Promise<FormattedEstatData> {
    const response = await this.getStatsDataRaw(statsDataId, options);
    return this.formatStatsData(response);
  }

  /**
   * 統計データを取得（生データ）
   */
  static async getStatsDataRaw(
    statsDataId: string,
    options: {
      categoryFilter?: string;
      yearFilter?: string;
      areaFilter?: string;
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
        ...(options.areaFilter && { cdArea: options.areaFilter }),
      });

      return response;
    } catch (error) {
      console.error("Failed to fetch stats data:", error);
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
   * 統計データレスポンスを整形
   */
  static formatStatsData(response: EstatStatsDataResponse): FormattedEstatData {
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
    const values = this.formatValues(data.DATA_INF?.VALUE || []);

    return {
      tableInfo,
      areas,
      categories,
      years,
      values,
    };
  }

  /**
   * 地域情報を整形
   */
  static formatAreas(classInfo: any[]): FormattedArea[] {
    const areaClass = classInfo.find((cls) => cls["@id"] === "area");
    if (!areaClass?.CLASS) return [];

    const areas = Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS
      : [areaClass.CLASS];

    return areas.map((area: any) => ({
      code: area["@code"] || "",
      name: area["@name"] || "",
    }));
  }

  /**
   * カテゴリ情報を整形
   */
  static formatCategories(classInfo: any[]): FormattedCategory[] {
    const categoryClass = classInfo.find((cls) => cls["@id"] === "cat01");
    if (!categoryClass?.CLASS) return [];

    const categories = Array.isArray(categoryClass.CLASS)
      ? categoryClass.CLASS
      : [categoryClass.CLASS];

    return categories.map((category: any) => ({
      code: category["@code"] || "",
      name: category["@name"] || "",
      unit: category["@unit"] || null,
    }));
  }

  /**
   * 年次情報を整形
   */
  static formatYears(classInfo: any[]): FormattedYear[] {
    const timeClass = classInfo.find((cls) => cls["@id"] === "time");
    if (!timeClass?.CLASS) return [];

    const years = Array.isArray(timeClass.CLASS)
      ? timeClass.CLASS
      : [timeClass.CLASS];

    return years.map((year: any) => ({
      code: year["@code"] || "",
      name: year["@name"] || "",
    }));
  }

  /**
   * データ値を整形
   */
  static formatValues(values: EstatValue[]): FormattedValue[] {
    return values.map((value) => {
      const numericValue = parseFloat(value.$ || "0");
      return {
        areaCode: value["@area"] || "",
        categoryCode: value["@cat01"] || "",
        yearCode: value["@time"] || "",
        value: numericValue || 0,
        unit: value["@unit"] || null,
      };
    });
  }

  /**
   * メタ情報を取得
   */
  static async getMetaInfo(
    statsDataId: string
  ): Promise<EstatMetaCategoryData[]> {
    try {
      const response = await estatAPI.getMetaInfo({ statsDataId });
      return this.transformToCSVFormat(response);
    } catch (error) {
      console.error("Failed to fetch meta info:", error);
      throw new Error(
        `メタ情報の取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * メタ情報をCSV形式に変換
   */
  private static transformToCSVFormat(metaInfo: any): EstatMetaCategoryData[] {
    const metaData = metaInfo.GET_META_INFO?.METADATA_INF;
    if (!metaData) {
      throw new Error("メタ情報が見つかりません");
    }

    const tableInfo = metaData.TABLE_INF;
    const classInfo = metaData.CLASS_INF?.CLASS_OBJ;

    if (!tableInfo || !classInfo) {
      throw new Error("必要なメタ情報が不足しています");
    }

    const result: EstatMetaCategoryData[] = [];
    const statsDataId = tableInfo["@id"] || "";
    const statName = tableInfo.STAT_NAME?.$ || "";
    const title = tableInfo.TITLE?.$ || "";

    // カテゴリ情報を取得（cat01のみ）
    const cat01Class = classInfo.find(
      (cls: { "@id": string }) => cls["@id"] === "cat01"
    );
    if (!cat01Class?.CLASS) {
      throw new Error("cat01カテゴリが見つかりません");
    }

    const categories = Array.isArray(cat01Class.CLASS)
      ? cat01Class.CLASS
      : [cat01Class.CLASS];

    // 各カテゴリをCSV行として変換
    categories.forEach(
      (category: {
        "@code"?: string;
        "@name"?: string | undefined;
        "@unit"?: string;
      }) => {
        const itemName = category["@name"] || null;
        result.push({
          stats_data_id: statsDataId,
          stat_name: statName,
          title: title,
          cat01: category["@code"] ?? "",
          item_name: itemName,
          unit: category["@unit"] || null,
        });
      }
    );

    return result;
  }

  /**
   * 有効な値のみをフィルタリング
   */
  static getValidValues(values: FormattedValue[]): FormattedValue[] {
    return values.filter((v) => v.value !== null && v.value !== undefined);
  }

  /**
   * 都道府県データのみをフィルタリング
   */
  static getPrefectureValues(values: FormattedValue[]): FormattedValue[] {
    return values.filter((v) => v.areaCode && v.areaCode !== "00000");
  }

  /**
   * データをCSV形式に変換
   */
  static convertToCSV(data: FormattedEstatData): string {
    const headers = [
      "area_code",
      "area_name",
      "category_code",
      "category_name",
      "year_code",
      "year_name",
      "value",
      "unit",
    ];

    const rows = data.values.map((value) => {
      const area = data.areas.find((a) => a.code === value.areaCode);
      const category = data.categories.find(
        (c) => c.code === value.categoryCode
      );
      const year = data.years.find((y) => y.code === value.yearCode);

      return [
        value.areaCode,
        area?.name || "",
        value.categoryCode,
        category?.name || "",
        value.yearCode,
        year?.name || "",
        value.value,
        value.unit || "",
      ];
    });

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }
}
