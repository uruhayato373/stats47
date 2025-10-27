import { FormattedValue } from "../../types";

/**
 * e-STATデータフィルター
 * 責務: データのフィルタリング操作
 */
export class EstatDataFilter {
  /**
   * 有効な値のみをフィルタリング
   *
   * @param values - 値配列
   * @returns 有効な値のみの配列
   */
  static getValidValues(values: FormattedValue[]): FormattedValue[] {
    return values.filter((v) => v.value !== null && v.value !== undefined);
  }

  /**
   * 都道府県データのみをフィルタリング
   *
   * @param values - 値配列
   * @returns 都道府県データのみの配列（全国データを除外）
   */
  static getPrefectureValues(values: FormattedValue[]): FormattedValue[] {
    return values.filter(
      (v) => v.dimensions.area.code && v.dimensions.area.code !== "00000"
    );
  }
}
