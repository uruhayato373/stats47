import { estatAPI } from "@/services/estat-api";
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
} from "../types";
import { EstatMetaCategoryData } from "@/lib/estat/types";
import { EstatRelationalCacheService } from "@/lib/estat/cache/EstatRelationalCacheService";

/**
 * e-STAT統計データサービスクラス
 * 統計データの取得、整形、CSV変換を担当
 */
export class EstatStatsDataService {
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

    // データ整形
    const areas = this.formatAreas(data);
    const categories = this.formatCategories(data);
    const years = this.formatYears(data);
    const values = this.formatValues(data, areas, categories, years);

    // メタデータ計算
    const validValues = values.filter((v) => v.numericValue !== null).length;
    const metadata = {
      processedAt: new Date().toISOString(),
      totalRecords: values.length,
      validValues,
      nullValues: values.length - validValues,
    };

    return {
      tableInfo,
      areas,
      categories,
      years,
      values,
      metadata,
    };
  }

  /**
   * メタデータをCSV形式に変換
   */
  static transformToCSVFormat(
    metaInfo: Record<string, unknown>,
    statsDataId: string
  ): EstatMetaCategoryData[] {
    const result: EstatMetaCategoryData[] = [];

    // 基本情報を取得
    const getMetaInfo = metaInfo.GET_META_INFO as
      | Record<string, unknown>
      | undefined;
    const tableInf = getMetaInfo?.TABLE_INF as
      | Record<string, unknown>
      | undefined;
    const statName =
      (tableInf?.STAT_NAME as Record<string, string> | undefined)?.["$"] || "";
    const title =
      (tableInf?.TITLE as Record<string, string> | undefined)?.["$"] || "";

    // カテゴリ情報を処理
    const classInf = getMetaInfo?.CLASS_INF as
      | Record<string, unknown>
      | undefined;
    const classObjList = (classInf?.CLASS_OBJ as unknown[]) || [];

    for (const classObj of classObjList) {
      const classObjTyped = classObj as Record<string, unknown>;
      if (classObjTyped["@id"] === "cat01") {
        const classes = Array.isArray(classObjTyped.CLASS)
          ? classObjTyped.CLASS
          : [classObjTyped.CLASS];

        for (const cls of classes) {
          const clsTyped = cls as Record<string, unknown>;
          if (clsTyped && clsTyped["@code"] && clsTyped["@name"]) {
            const code = clsTyped["@code"] as string;
            const fullName = clsTyped["@name"] as string;
            const unit = (clsTyped["@unit"] as string) || null;

            // item_nameからcat01のコードを除去
            const itemName = this.extractItemName(fullName, code);

            result.push({
              stats_data_id: statsDataId,
              stat_name: statName,
              title: title,
              cat01: code,
              item_name: itemName,
              unit: unit,
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * メタ情報をCSV形式で取得
   */
  static async getMetaInfoAsCSV(
    statsDataId: string
  ): Promise<EstatMetaCategoryData[]> {
    try {
      const response = await estatAPI.getMetaInfo({ statsDataId });
      return this.transformToCSVFormat(response as any, statsDataId);
    } catch (error) {
      console.error("Failed to get meta info as CSV:", error);
      throw new Error(
        `メタ情報のCSV取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 利用可能な年度一覧を取得（リレーショナルキャッシュ対応）
   */
  static async getAvailableYears(
    statsDataId: string,
    categoryCode: string
  ): Promise<string[]> {
    try {
      // 1. リレーショナルキャッシュから年度一覧を取得
      const cachedYears = await EstatRelationalCacheService.getAvailableYears(
        statsDataId,
        categoryCode
      );

      if (cachedYears && cachedYears.length > 0) {
        console.log(`年度一覧キャッシュヒット: ${statsDataId}_${categoryCode}`);
        return cachedYears;
      }

      // 2. キャッシュミス: APIから取得
      console.log(`年度一覧API取得: ${statsDataId}_${categoryCode}`);
      const response = await this.getAndFormatStatsData(statsDataId, {
        categoryFilter: categoryCode,
        areaFilter: "00000",
      });

      const years = Array.from(
        new Set(
          response.values
            .filter((v) => v.timeCode && v.timeCode.length >= 4)
            .map((v) => v.timeCode)
        )
      ).sort((a, b) => b.localeCompare(a));

      return years;
    } catch (error) {
      console.error("Failed to get available years:", error);
      console.error("Error details:", {
        statsDataId,
        categoryCode,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `年度一覧の取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 都道府県データを年度別に取得（リレーショナルキャッシュ対応）
   * 全国データ(areaCode=00000)を除外した都道府県データのみを返す
   */
  static async getPrefectureDataByYear(
    statsDataId: string,
    categoryCode: string,
    yearCode: string,
    limit: number = 100000
  ): Promise<FormattedValue[]> {
    try {
      // 1. リレーショナルキャッシュからデータを取得
      const cachedData = await EstatRelationalCacheService.getRankingData(
        statsDataId,
        categoryCode,
        yearCode
      );

      if (cachedData && cachedData.length > 0) {
        console.log(
          `都道府県データキャッシュヒット: ${statsDataId}_${categoryCode}_${yearCode}`
        );
        return cachedData;
      }

      // 2. キャッシュミス: APIから取得
      console.log(
        `都道府県データAPI取得: ${statsDataId}_${categoryCode}_${yearCode}`
      );
      const response = await this.getAndFormatStatsData(statsDataId, {
        categoryFilter: categoryCode,
        yearFilter: yearCode,
        limit,
      });

      // 都道府県データのみをフィルタリング
      const prefectureValues = response.values.filter(
        (v) => v.areaCode && v.areaCode !== "00000" && v.numericValue !== null
      );

      if (prefectureValues.length === 0) {
        throw new Error("都道府県データが見つかりませんでした");
      }

      // 3. 取得したデータをキャッシュに保存（同期）
      try {
        await EstatRelationalCacheService.saveRankingData(
          statsDataId,
          categoryCode,
          yearCode,
          prefectureValues
        );
        console.log(
          `キャッシュ保存完了: ${statsDataId}_${categoryCode}_${yearCode}`
        );
      } catch (error) {
        console.warn("キャッシュ保存に失敗:", error);
      }

      return prefectureValues;
    } catch (error) {
      console.error("Failed to get prefecture data:", error);
      throw new Error(
        `都道府県データの取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 地域情報を整形
   */
  private static formatAreas(data: EstatStatisticalData): FormattedArea[] {
    const classObjList = data.CLASS_INF?.CLASS_OBJ || [];
    const areaClass = classObjList.find((cls) => cls["@id"] === "area");

    if (!areaClass?.CLASS) return [];

    const classes = Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS
      : [areaClass.CLASS];

    return classes.map((cls) => ({
      areaCode: cls["@code"]?.trim() || "",
      areaName: this.cleanString(cls["@name"] || ""),
      level: cls["@level"] || "1",
      parentCode: cls["@parentCode"]?.trim(),
    }));
  }

  /**
   * カテゴリ情報を整形
   */
  private static formatCategories(
    data: EstatStatisticalData
  ): FormattedCategory[] {
    const classObjList = data.CLASS_INF?.CLASS_OBJ || [];
    const categoryClasses = classObjList.filter(
      (cls) => cls["@id"] && cls["@id"].startsWith("cat")
    );

    const categories: FormattedCategory[] = [];

    categoryClasses.forEach((catClass) => {
      if (!catClass.CLASS) return;

      const classes = Array.isArray(catClass.CLASS)
        ? catClass.CLASS
        : [catClass.CLASS];

      classes.forEach((cls) => {
        categories.push({
          categoryCode: cls["@code"]?.trim() || "",
          categoryName: cls["@name"]?.trim() || "",
          displayName: this.cleanString(cls["@name"] || ""),
          unit: cls["@unit"]?.trim() || null,
        });
      });
    });

    return categories;
  }

  /**
   * 年情報を整形
   */
  private static formatYears(data: EstatStatisticalData): FormattedYear[] {
    const classObjList = data.CLASS_INF?.CLASS_OBJ || [];
    const timeClass = classObjList.find((cls) => cls["@id"] === "time");

    if (!timeClass?.CLASS) return [];

    const classes = Array.isArray(timeClass.CLASS)
      ? timeClass.CLASS
      : [timeClass.CLASS];

    return classes.map((cls) => {
      const code = cls["@code"]?.trim() || "";
      const name = cls["@name"]?.trim() || "";

      return {
        timeCode: code,
        timeName: this.cleanString(name),
      };
    });
  }

  /**
   * 値情報を整形
   */
  private static formatValues(
    data: EstatStatisticalData,
    areas: FormattedArea[],
    categories: FormattedCategory[],
    years: FormattedYear[]
  ): FormattedValue[] {
    const values = data.DATA_INF?.VALUE || [];
    const valueArray = Array.isArray(values) ? values : [values];

    return valueArray.map((val) => {
      const rawValue = val.$?.trim() || "";
      const numericValue = this.parseNumericValue(rawValue);

      // 値の属性から関連情報を取得
      const areaCode = val["@area"]?.trim() || "";
      const categoryAttrs = Object.keys(val).filter((key) =>
        key.startsWith("@cat")
      ) as Array<keyof EstatValue>;
      const timeCode = val["@time"]?.trim() || "";

      // 地域情報
      const areaInfo = areaCode
        ? areas.find((a) => a.areaCode === areaCode)
        : undefined;

      // カテゴリ情報（最初のカテゴリを使用）
      const firstCategoryAttr = categoryAttrs[0];
      const firstCategoryCode = firstCategoryAttr
        ? (val[firstCategoryAttr] as string)?.trim()
        : "";
      const firstCategory = firstCategoryCode
        ? categories.find((c) => c.categoryCode === firstCategoryCode)
        : undefined;

      // 年情報
      const yearInfo = timeCode
        ? years.find((y) => y.timeCode === timeCode)
        : undefined;

      // 単位の取得（最初のカテゴリの単位を使用）
      const unit = firstCategory?.unit || null;

      return {
        value: rawValue,
        numericValue,
        displayValue: this.formatDisplayValue(numericValue, rawValue, unit),
        unit,
        areaCode,
        areaName: areaInfo?.areaName || "",
        categoryCode: firstCategoryCode,
        categoryName: firstCategory?.categoryName || "",
        timeCode,
        timeName: yearInfo?.timeName || "",
      };
    });
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

  /**
   * 数値をパース
   */
  private static parseNumericValue(value: string): number | null {
    if (!value || value === "-" || value === "…" || value === "***") {
      return null;
    }

    const cleanValue = value.replace(/[,\s]/g, "");
    const parsed = parseFloat(cleanValue);

    return isNaN(parsed) ? null : parsed;
  }

  /**
   * 表示用の値をフォーマット
   */
  private static formatDisplayValue(
    numericValue: number | null,
    originalValue: string,
    unit: string | null
  ): string {
    if (numericValue === null) {
      return originalValue || "-";
    }

    const formatted = numericValue.toLocaleString("ja-JP");
    return unit ? `${formatted}${unit}` : formatted;
  }

  /**
   * item_nameからcat01のコードを除去する
   */
  private static extractItemName(fullName: string, code: string): string {
    // パターン1: "A1101_総人口" → "総人口"
    if (fullName.includes("_")) {
      const parts = fullName.split("_");
      if (parts[0] === code && parts.length > 1) {
        return parts.slice(1).join("_");
      }
    }

    // パターン2: "A1101総人口" → "総人口"
    if (fullName.startsWith(code)) {
      return fullName.substring(code.length);
    }

    // パターン3: その他の場合は元の名前を返す
    return fullName;
  }
}
