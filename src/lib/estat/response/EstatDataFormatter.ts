import { EstatStatsDataResponse, EstatStatsListResponse } from "@/types/estat";
import {
  FormattedArea,
  FormattedCategory,
  FormattedYear,
  FormattedValue,
  FormattedEstatData,
  FormattedStatListItem,
} from "@/types/estat/formatted";

/**
 * e-STAT APIレスポンスデータ整形クラス
 * APIレスポンスの整形・変換を担当
 */
export class EstatDataFormatter {
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
      statisticsName: table.STATISTICS_NAME?.$?.trim() || "",
      surveyDate: table.SURVEY_DATE || "",
      updatedDate: table.UPDATED_DATE || "",
      description: table.DESCRIPTION?.$?.trim(),
    }));
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
      areaCode: cls["@code"]?.trim() || "",
      areaName: this.cleanString(cls["@name"] || ""),
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
        timeCode: code,
        timeName: this.cleanString(name),
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
        ? years.find((y) => y.timeCode === timeCode)
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
              timeCode: yearInfo.timeCode,
              timeName: yearInfo.timeName,
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
}
