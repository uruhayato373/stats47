import { formatYear } from '@stats47/utils';

/** 暦年と確認された指標では、旧snapshotの「年度」表記を引き継がない。 */
export function themeYearLabel(
  yearCode: string,
  yearName: string | null | undefined,
  yearFormat?: string
): string {
  return yearFormat === 'calendar' && /^\d{4}/.test(yearCode)
    ? formatYear(yearCode.slice(0, 4))
    : (yearName ?? formatYear(yearCode));
}
