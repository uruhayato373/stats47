import type { YearCode, YearName } from "@stats47/types";

/**
 * 時間名から年度名を抽出
 *
 * @param timeName - e-Stat APIの時間名
 * @returns 年度名
 * @example
 * extractYearName("2020年度") // => "2020年度"
 * extractYearName("2020年") // => "2020年"
 */
export function extractYearName(timeName: string): YearName {
  // 既に年度形式の場合はそのまま返す
  return timeName;
}

/**
 * 年度コードから年度名を生成
 *
 * @param yearCode - 年度コード（4桁）
 * @param suffix - 接尾辞（デフォルト: "年"）
 * @returns 年度名
 * @example
 * generateYearName("2020") // => "2020年"
 * generateYearName("2020", "年度") // => "2020年度"
 */
export function generateYearName(
  yearCode: YearCode,
  suffix: "年" | "年度" = "年"
): YearName {
  return `${yearCode}${suffix}`;
}
