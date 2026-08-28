import type { StatsSchema } from "@stats47/types";

/** R2/e-Stat共通の正規化済み行から年度選択肢を決定的に作る。 */
export function extractYearsFromStats(
  data: readonly StatsSchema[],
): Array<{ yearCode: string; yearName: string }> {
  const years = new Map<string, { yearCode: string; yearName: string }>();
  for (const item of data) {
    if (item.yearCode && !years.has(item.yearCode)) {
      years.set(item.yearCode, { yearCode: item.yearCode, yearName: item.yearName });
    }
  }
  return [...years.values()].sort((a, b) => b.yearCode.localeCompare(a.yearCode));
}
