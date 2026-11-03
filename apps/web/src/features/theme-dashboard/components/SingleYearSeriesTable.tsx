import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import type { LineChartData } from '@/components/stat-charts/types/visualization';
import { ValueTable } from '@/components/surface';

export interface ObservedSeries {
  dataKey: string;
  name: string;
  unit?: string;
}

/** Count observations per series, not the union of unrelated survey years. */
export function partitionObservedSeries<T extends ObservedSeries>(
  rows: LineChartData['data'],
  series: T[]
): { history: T[]; single: T[]; commonYears: number } {
  const count = (key: string) =>
    rows.filter(
      (row) => typeof row[key] === 'number' && Number.isFinite(row[key])
    ).length;
  return {
    history: series.filter((item) => count(item.dataKey) > 1),
    single: series.filter((item) => count(item.dataKey) === 1),
    commonYears: rows.filter((row) =>
      series.every(
        (item) =>
          typeof row[item.dataKey] === 'number' &&
          Number.isFinite(row[item.dataKey])
      )
    ).length,
  };
}

/** A one-observation series is a dated value, not a trend or a missing chart. */
export function SingleYearSeriesTable({
  rows,
  series,
  yearKey,
  nameColumnLabel = '指標',
  ariaLabel = '単年の指標比較',
}: {
  rows: LineChartData['data'];
  series: ObservedSeries[];
  yearKey: string;
  nameColumnLabel?: string;
  ariaLabel?: string;
}) {
  if (series.length === 0) return null;
  return (
    <ValueTable
      ariaLabel={ariaLabel}
      columns={[
        { key: 'name', header: nameColumnLabel, rowHeader: true },
        { key: 'year', header: '年次', align: 'left', className: 'whitespace-nowrap' },
        { key: 'value', header: '値' },
      ]}
      rows={series.flatMap((item) => {
        const row = rows.find(
          (candidate) =>
            typeof candidate[item.dataKey] === 'number' &&
            Number.isFinite(candidate[item.dataKey])
        );
        if (!row) return [];
        return [
          {
            key: item.dataKey,
            cells: [
              item.name,
              String(row[yearKey]),
              `${(row[item.dataKey] as number).toLocaleString('ja-JP', {
                maximumFractionDigits: 2,
              })}${item.unit ? ` ${formatUnitForDisplay(item.unit)}` : ''}`,
            ],
          },
        ];
      })}
    />
  );
}
