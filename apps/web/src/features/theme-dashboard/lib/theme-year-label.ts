import { formatYear } from '@stats47/utils';

/** 明示的な暦年指標の旧「年度」表記だけを直し、月・基準日・注記は保持する。 */
export function themeYearLabel(
  yearCode: string,
  yearName: string | null | undefined,
  yearFormat?: string
): string {
  const label =
    yearName && yearName !== yearCode ? yearName : formatYear(yearCode);
  if (yearFormat !== 'calendar' || !/^\d{4}(?:[01]00000)?$/.test(yearCode))
    return label;
  const year = yearCode.slice(0, 4);
  return label.startsWith(`${year}年度`)
    ? label.replace(`${year}年度`, `${year}年`)
    : label;
}
