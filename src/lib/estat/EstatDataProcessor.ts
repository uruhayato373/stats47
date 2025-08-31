import { estatAPI } from "@/services/estat-api";
import { EstatStatsDataResponse, EstatStatsListResponse } from "@/types/estat";
import {
  EstatMetaCategoryData,
  FormattedArea,
  FormattedCategory,
  FormattedYear,
  FormattedValue,
  FormattedEstatData,
  FormattedStatListItem,
} from "@/types/estat/formatted";

/**
 * e-STAT APIレスポンスデータ処理クラス
 * APIからのレスポンスを整形・変換する責務を持つ
 */
export class EstatDataProcessor {
  /**
   * 統計データリストを取得・整形
   */
  static async getStatsList(
    options: {
      searchWord?: string;
      searchKind?: string;
      startPosition?: number;
      limit?: number;
    } = {}
  ): Promise<FormattedStatListItem[]> {
    try {
      const response = await estatAPI.getStatsList({
        searchKind: "1",
        startPosition: 1,
        limit: 20,
        ...options,
      });

      return this.formatStatsList(response);
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
   * 統計データを取得・整形
   */
  static async getStatsData(
    statsDataId: string,
    options: {
      categoryFilter?: string;
      yearFilter?: string;
      limit?: number;
    } = {}
  ): Promise<FormattedEstatData> {
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

      return this.formatStatsData(response);
    } catch (error) {
      console.error("Failed to fetch stats data:", error);
      throw new Error(
        `統計データの取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 統計データリストレスポンスを整形
   */
  private static formatStatsList(
    response: EstatStatsListResponse
  ): FormattedStatListItem[] {
    const tables = response.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];

    return tables.map((table) => ({
      id: table["@id"],
      statName: table.STAT_NAME?.$?.trim() || "",
      title: table.TITLE?.$?.trim() || "",
      govOrg: table.GOV_ORG?.$?.trim() || "",
      statisticsName: table.STATISTICS_NAME?.$?.trim() || "",
      surveyDate: table.SURVEY_DATE || "",
      updatedDate: table.UPDATED_DATE || "",
      description: table.DESCRIPTION?.$?.trim(),
    }));
  }

  /**
   * 統計データレスポンスを整形
   */
  private static formatStatsData(
    response: EstatStatsDataResponse
  ): FormattedEstatData {
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
   * 地域情報を整形
   */
  private static formatAreas(data: any): FormattedArea[] {
    const classObjList = data.CLASS_INF?.CLASS_OBJ || [];
    const areaClass = classObjList.find((cls: any) => cls["@id"] === "area");

    if (!areaClass?.CLASS) return [];

    const classes = Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS
      : [areaClass.CLASS];

    return classes.map((cls: any) => ({
      code: cls["@code"]?.trim() || "",
      name: cls["@name"]?.trim() || "",
      displayName: this.cleanString(cls["@name"] || ""),
      level: cls["@level"] || "1",
      parentCode: cls["@parentCode"]?.trim(),
    }));
  }

  /**
   * カテゴリ情報を整形
   */
  private static formatCategories(data: any): FormattedCategory[] {
    const classObjList = data.CLASS_INF?.CLASS_OBJ || [];
    const categoryClasses = classObjList.filter(
      (cls: any) => cls["@id"] && cls["@id"].startsWith("cat")
    );

    const categories: FormattedCategory[] = [];

    categoryClasses.forEach((catClass: any) => {
      if (!catClass.CLASS) return;

      const classes = Array.isArray(catClass.CLASS)
        ? catClass.CLASS
        : [catClass.CLASS];

      classes.forEach((cls: any) => {
        categories.push({
          code: cls["@code"]?.trim() || "",
          name: cls["@name"]?.trim() || "",
          displayName: this.cleanString(cls["@name"] || ""),
          level: cls["@level"] || "1",
          unit: cls["@unit"]?.trim(),
        });
      });
    });

    return categories;
  }

  /**
   * 年情報を整形
   */
  private static formatYears(data: any): FormattedYear[] {
    const classObjList = data.CLASS_INF?.CLASS_OBJ || [];
    const timeClass = classObjList.find((cls: any) => cls["@id"] === "time");

    if (!timeClass?.CLASS) return [];

    const classes = Array.isArray(timeClass.CLASS)
      ? timeClass.CLASS
      : [timeClass.CLASS];

    return classes.map((cls: any) => {
      const code = cls["@code"]?.trim() || "";
      const name = cls["@name"]?.trim() || "";

      return {
        code,
        year: this.extractYear(code, name),
        displayName: this.cleanString(name),
        fromDate: cls["@from"]?.trim(),
        toDate: cls["@to"]?.trim(),
      };
    });
  }

  /**
   * 値情報を整形
   */
  private static formatValues(
    data: any,
    areas: FormattedArea[],
    categories: FormattedCategory[],
    years: FormattedYear[]
  ): FormattedValue[] {
    const values = data.DATA_INF?.VALUE || [];
    const valueArray = Array.isArray(values) ? values : [values];

    return valueArray.map((val: any) => {
      const rawValue = val.$?.trim() || "";
      const numericValue = this.parseNumericValue(rawValue);

      // 値の属性から関連情報を取得
      const areaCode = val["@area"]?.trim();
      const categoryAttrs = Object.keys(val).filter((key) =>
        key.startsWith("@cat")
      );
      const timeCode = val["@time"]?.trim();

      // 地域情報
      const areaInfo = areaCode
        ? areas.find((a) => a.code === areaCode)
        : undefined;

      // カテゴリ情報
      const categoryInfo: Record<string, { code: string; name: string }> = {};
      categoryAttrs.forEach((attr) => {
        const categoryCode = val[attr]?.trim();
        if (categoryCode) {
          const category = categories.find((c) => c.code === categoryCode);
          if (category) {
            categoryInfo[attr.replace("@", "")] = {
              code: category.code,
              name: category.name,
            };
          }
        }
      });

      // 年情報
      const yearInfo = timeCode
        ? years.find((y) => y.code === timeCode)
        : undefined;

      // 単位の取得（最初に見つかったカテゴリの単位を使用）
      const unit = Object.values(categoryInfo)[0]
        ? categories.find((c) => c.code === Object.values(categoryInfo)[0].code)
            ?.unit || null
        : null;

      return {
        value: rawValue,
        numericValue,
        displayValue: this.formatDisplayValue(numericValue, rawValue, unit),
        unit,
        areaCode,
        areaInfo: areaInfo
          ? {
              code: areaInfo.code,
              displayName: areaInfo.displayName,
            }
          : undefined,
        categories: categoryInfo,
        yearInfo: yearInfo
          ? {
              code: yearInfo.code,
              year: yearInfo.year,
              displayName: yearInfo.displayName,
            }
          : undefined,
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
   * 年を抽出
   */
  private static extractYear(code: string, name: string): number {
    const yearMatch = (code + name).match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1]) : 0;
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
