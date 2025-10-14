import { FormattedEstatData } from "../types/formatted";

/**
 * e-STAT CSV変換クラス
 * 責務: データのCSV形式への変換
 */
export class EstatCSVConverter {
  /**
   * データをCSV形式に変換
   *
   * @param data - 整形された統計データ
   * @returns CSV形式の文字列
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
      return [
        value.areaCode,
        value.areaName,
        value.categoryCode,
        value.categoryName,
        value.timeCode,
        value.timeName,
        value.value,
        value.unit || "",
      ];
    });

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }
}
