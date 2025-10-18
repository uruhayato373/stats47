import { FormattedValue } from "@/lib/estat-api";
import { TimeSeriesDataPoint } from "@/components/molecules/D3LineChart";
import { MultiSeriesDataPoint } from "../types";

/**
 * FormattedValueデータのフォーマッター
 */
export class FormattedValueCSVFormatter {
  static getHeaders(): string[] {
    return [
      "順位",
      "都道府県コード",
      "都道府県名",
      "値",
      "単位",
      "年度",
      "時点コード",
    ];
  }

  static formatRow(item: FormattedValue): (string | number)[] {
    return [
      item.rank ?? "-",
      item.areaCode,
      item.areaName,
      item.value ?? "-",
      item.unit ?? "-",
      item.timeName ?? "-",
      item.timeCode ?? "-",
    ];
  }

  static format(data: FormattedValue[]): string[][] {
    return [
      this.getHeaders(),
      ...data.map((item) => this.formatRow(item).map(String)),
    ];
  }
}

/**
 * 時系列データのフォーマッター
 */
export class TimeSeriesCSVFormatter {
  static getHeaders(): string[] {
    return ["年度", "時点コード", "値", "単位", "地域名", "地域コード"];
  }

  static formatRow(item: TimeSeriesDataPoint): (string | number)[] {
    return [
      item.date,
      item.timeCode ?? "-",
      item.value,
      item.unit ?? "-",
      item.areaName ?? "-",
      item.areaCode ?? "-",
    ];
  }

  static format(data: TimeSeriesDataPoint[]): string[][] {
    return [
      this.getHeaders(),
      ...data.map((item) => this.formatRow(item).map(String)),
    ];
  }
}

/**
 * 複数系列データのフォーマッター
 */
export class MultiSeriesCSVFormatter {
  static getHeaders(keys: string[]): string[] {
    return ["年度", "時点コード", ...keys, "単位"];
  }

  static formatRow(
    item: MultiSeriesDataPoint,
    keys: string[]
  ): (string | number)[] {
    return [
      item.time,
      item.timeCode ?? "-",
      ...keys.map((key) => item[key] ?? "-"),
      item.unit ?? "-",
    ];
  }

  static format(data: MultiSeriesDataPoint[], keys: string[]): string[][] {
    return [
      this.getHeaders(keys),
      ...data.map((item) => this.formatRow(item, keys).map(String)),
    ];
  }
}
