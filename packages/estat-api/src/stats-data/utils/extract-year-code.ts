import type { EstatTimeCode, YearCode } from "@stats47/types";

/**
 * e-Stat APIの時間コードから年度コードを抽出
 *
 * e-Stat APIの時間コードは通常10桁の形式（例: "2024100000" = 2024年度）で、
 * 最初の4桁が年度を表します。
 *
 * @param timeCode - e-Stat APIの時間コード（10桁または4桁以上）
 * @returns 年度コード（4桁）、無効な場合は元の値を返す
 * @example
 * extractYearCode("2024100000") // => "2024"
 * extractYearCode("2020000000") // => "2020"
 * extractYearCode("2020") // => "2020"
 * extractYearCode("202") // => "202" (4桁未満の場合はそのまま返す)
 */
export function extractYearCode(timeCode: EstatTimeCode): YearCode {
  if (!timeCode || typeof timeCode !== "string") {
    return timeCode;
  }

  // 4桁以上の場合、最初の4桁を年度コードとして抽出
  if (timeCode.length >= 4) {
    const yearCode = timeCode.substring(0, 4);
    // 4桁がすべて数字かチェック
    if (/^\d{4}$/.test(yearCode)) {
      return yearCode;
    }
  }

  // 4桁未満または無効な形式の場合はそのまま返す
  return timeCode;
}
