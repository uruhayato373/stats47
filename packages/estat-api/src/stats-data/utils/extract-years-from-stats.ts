import type { StatsSchema } from "@stats47/types";

/**
 * StatsSchema配列から年度一覧を抽出する
 *
 * 重複を排除し、年度コードの降順でソートして返す。
 *
 * @param data - StatsSchema配列
 * @returns 年度一覧（yearCode降順）
 * @example
 * const years = extractYearsFromStats(statsData);
 * // => [{ yearCode: "2023", yearName: "2023年" }, { yearCode: "2022", yearName: "2022年" }, ...]
 */
export function extractYearsFromStats(
  data: StatsSchema[]
): { yearCode: string; yearName: string }[] {
  const yearsMap = new Map<string, { yearCode: string; yearName: string }>();

  for (const item of data) {
    if (item.yearCode && !yearsMap.has(item.yearCode)) {
      yearsMap.set(item.yearCode, {
        yearCode: item.yearCode,
        yearName: item.yearName,
      });
    }
  }

  return Array.from(yearsMap.values()).sort((a, b) =>
    b.yearCode.localeCompare(a.yearCode)
  );
}
