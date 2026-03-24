import type { EstatTimeCode, YearCode } from "@stats47/types";
import { extractYearCode } from "./extract-year-code";

/**
 * 年度コードが有効かどうかを検証
 *
 * @param yearCode - 年度コード（4桁）
 * @param minYear - 最小年度（デフォルト: 1900）
 * @param maxYear - 最大年度（デフォルト: 2100）
 * @returns 有効な年度コードの場合true
 * @example
 * isValidYearCode("2024") // => true
 * isValidYearCode("1800") // => false (範囲外)
 * isValidYearCode("abc") // => false (数値でない)
 */
export function isValidYearCode(
  yearCode: string,
  minYear: number = 1900,
  maxYear: number = 2100
): boolean {
  if (!yearCode || typeof yearCode !== "string" || yearCode.length !== 4) {
    return false;
  }

  const yearNum = parseInt(yearCode, 10);
  return !isNaN(yearNum) && yearNum >= minYear && yearNum <= maxYear;
}

/**
 * 時間コードから年度コードを抽出し、有効性を検証
 *
 * @param timeCode - e-Stat APIの時間コード
 * @param minYear - 最小年度（デフォルト: 1900）
 * @param maxYear - 最大年度（デフォルト: 2100）
 * @returns 有効な年度コード、またはnull
 * @example
 * extractAndValidateYearCode("2024100000") // => "2024"
 * extractAndValidateYearCode("1800100000") // => null (範囲外)
 * extractAndValidateYearCode("abc") // => null (無効)
 */
export function extractAndValidateYearCode(
  timeCode: EstatTimeCode,
  minYear: number = 1900,
  maxYear: number = 2100
): YearCode | null {
  const yearCode = extractYearCode(timeCode);
  if (isValidYearCode(yearCode, minYear, maxYear)) {
    return yearCode;
  }
  return null;
}
