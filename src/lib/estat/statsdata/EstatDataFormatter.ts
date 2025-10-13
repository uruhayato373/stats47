import {
  EstatStatsDataResponse,
  EstatStatisticalData,
  EstatValue,
} from "@/lib/estat/types";
import {
  FormattedArea,
  FormattedCategory,
  FormattedYear,
  FormattedValue,
  FormattedEstatData,
} from "@/lib/estat/types/formatted";

/**
 * e-STAT統計データフォーマッター
 * クライアントサイドで使用可能な純粋なデータ変換関数
 */
export class EstatDataFormatter {
  /**
   * 統計データを整形
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
   * 地域データを整形
   */
  private static formatAreas(data: EstatStatisticalData): FormattedArea[] {
    const areas: FormattedArea[] = [];
    const classTables = data.CLASS_INF?.CLASS_OBJ || {};

    if ((classTables as any).CLASS_OBJ_AREA?.CLASS) {
      (classTables as any).CLASS_OBJ_AREA.CLASS.forEach((cls: any) => {
        areas.push({
          areaCode: cls["@code"] || "",
          areaName: cls["@name"] || "",
          level: "prefecture",
        });
      });
    }

    return areas;
  }

  /**
   * カテゴリデータを整形
   */
  private static formatCategories(
    data: EstatStatisticalData
  ): FormattedCategory[] {
    const categories: FormattedCategory[] = [];
    const classTables = data.CLASS_INF?.CLASS_OBJ || {};

    if ((classTables as any).CLASS_OBJ_CAT01?.CLASS) {
      (classTables as any).CLASS_OBJ_CAT01.CLASS.forEach((cls: any) => {
        categories.push({
          categoryCode: cls["@code"] || "",
          categoryName: cls["@name"] || "",
          displayName: cls["@name"] || "",
          unit: null,
        });
      });
    }

    return categories;
  }

  /**
   * 年度データを整形
   */
  private static formatYears(data: EstatStatisticalData): FormattedYear[] {
    const years: FormattedYear[] = [];
    const classTables = data.CLASS_INF?.CLASS_OBJ || {};

    if ((classTables as any).CLASS_OBJ_TIME?.CLASS) {
      (classTables as any).CLASS_OBJ_TIME.CLASS.forEach((cls: any) => {
        years.push({
          timeCode: cls["@code"] || "",
          timeName: cls["@name"] || "",
        });
      });
    }

    return years;
  }

  /**
   * 値データを整形
   */
  private static formatValues(
    data: EstatStatisticalData,
    areas: FormattedArea[],
    categories: FormattedCategory[],
    years: FormattedYear[]
  ): FormattedValue[] {
    const values: FormattedValue[] = [];
    const dataInf = data.DATA_INF?.VALUE || [];

    if (Array.isArray(dataInf)) {
      dataInf.forEach((value: EstatValue) => {
        const areaCode = value["@area"] || "";
        const categoryCode = value["@cat01"] || "";
        const timeCode = value["@time"] || "";

        const area = areas.find((a) => a.areaCode === areaCode);
        const category = categories.find(
          (c) => c.categoryCode === categoryCode
        );
        const year = years.find((y) => y.timeCode === timeCode);

        const numericValue = this.parseNumericValue(value.$);
        const unit = this.extractUnit(value.$);

        values.push({
          value: value.$ || "",
          numericValue,
          displayValue: this.formatDisplayValue(numericValue, value.$, unit),
          unit,
          areaCode,
          areaName: area?.areaName || "",
          categoryCode,
          categoryName: category?.categoryName || "",
          timeCode,
          timeName: year?.timeName || "",
          rank: 0, // ランクは後で計算
        });
      });
    }

    return values;
  }

  /**
   * 数値を解析
   */
  private static parseNumericValue(value: string): number | null {
    if (!value || value === "-" || value === "…") {
      return null;
    }

    // カンマを削除して数値に変換
    const cleanValue = value.replace(/,/g, "");
    const numeric = parseFloat(cleanValue);

    return isNaN(numeric) ? null : numeric;
  }

  /**
   * 単位を抽出
   */
  private static extractUnit(value: string): string {
    if (!value) return "";

    // 括弧内の単位を抽出
    const unitMatch = value.match(/\(([^)]+)\)/);
    return unitMatch ? unitMatch[1] : "";
  }

  /**
   * 表示用の値をフォーマット
   */
  private static formatDisplayValue(
    numericValue: number | null,
    rawValue: string,
    unit: string
  ): string {
    if (numericValue === null) {
      return rawValue || "データなし";
    }

    const formattedValue = numericValue.toLocaleString();
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  }
}
