import type { MetricConfig } from './types';

export interface YearNamedRow {
  yearCode: string;
  yearName: string;
}

const BARE_FISCAL_YEAR_NAME = /^\d{4}年度$/;

/**
 * 暦年の指標に残った「YYYY年度」だけを「YYYY年」へ直す。「2024年度末（2025年3月31日）」のように
 * 時点を説明する年名は取得元の表記なので変えない。
 */
export function relabelYearNames<R extends YearNamedRow>(
  rows: readonly R[],
  yearFormat: MetricConfig['yearFormat'],
): { rows: R[]; relabeled: number } {
  if (yearFormat === 'fiscal') return { rows: [...rows], relabeled: 0 };
  let relabeled = 0;
  const next = rows.map((row) => {
    if (!BARE_FISCAL_YEAR_NAME.test(row.yearName)) return row;
    relabeled += 1;
    return { ...row, yearName: `${row.yearCode}年` };
  });
  return { rows: next, relabeled };
}
