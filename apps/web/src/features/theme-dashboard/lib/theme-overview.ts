import type { ThemeIndicatorData } from '../types';
import type { RankingValue } from '@stats47/ranking';

/** 同年の有効な都道府県だけを比較。全国・市区町村・欠測・重複を除外する。 */
export function getOverviewValues(data: ThemeIndicatorData): RankingValue[] {
  const year = data.rankingItem.latestYear?.yearCode?.slice(0, 4);
  if (!year) return [];
  const byArea = new Map<string, RankingValue>();
  for (const row of data.rankingValues) {
    const pref = Number(row.areaCode.slice(0, 2));
    if (!/^\d{2}000$/.test(row.areaCode) || pref < 1 || pref > 47) continue;
    if (String(row.yearCode).slice(0, 4) !== year) continue;
    if (typeof row.value !== 'number' || !Number.isFinite(row.value)) continue;
    byArea.set(row.areaCode, row);
  }
  const sorted = [...byArea.values()].sort(
    (a, b) =>
      (b.value ?? 0) - (a.value ?? 0) || a.areaCode.localeCompare(b.areaCode)
  );
  let rank = 0;
  return sorted.map((row, index) => {
    if (index === 0 || row.value !== sorted[index - 1].value) rank = index + 1;
    return { ...row, rank };
  });
}

/** 全国の集計値とは別物。比較対象の県別値の中央を示す。 */
export function getOverviewMedian(values: RankingValue[]): number | null {
  const numbers = values
    .flatMap(({ value }) =>
      typeof value === 'number' && Number.isFinite(value) ? [value] : []
    )
    .sort((a, b) => a - b);
  if (numbers.length === 0) return null;
  const middle = Math.floor(numbers.length / 2);
  return numbers.length % 2
    ? numbers[middle]
    : (numbers[middle - 1] + numbers[middle]) / 2;
}

export function formatOverviewValue(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
    : '—';
}

export function formatOverviewDifference(
  value: number | null | undefined,
  median: number | null,
  unit: string
): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || median === null)
    return '—';
  const difference = Math.round((value - median) * 100) / 100;
  const differenceUnit =
    unit.normalize('NFKC').trim() === '%' ? 'ポイント' : unit.normalize('NFKC');
  return `${difference > 0 ? '+' : ''}${formatOverviewValue(difference)} ${differenceUnit}`;
}
