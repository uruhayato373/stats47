import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';

import type { LineChartData } from '@/components/stat-charts/types/visualization';

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
}: {
  rows: LineChartData['data'];
  series: ObservedSeries[];
  yearKey: string;
}) {
  if (series.length === 0) return null;
  return (
    <Table aria-label="単年の指標比較">
      <TableHeader>
        <TableRow>
          <TableHead>指標</TableHead>
          <TableHead>年次</TableHead>
          <TableHead className="text-right">値</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {series.map((item) => {
          const row = rows.find(
            (candidate) =>
              typeof candidate[item.dataKey] === 'number' &&
              Number.isFinite(candidate[item.dataKey])
          );
          if (!row) return null;
          return (
            <TableRow key={item.dataKey}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="whitespace-nowrap">
                {String(row[yearKey])}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(row[item.dataKey] as number).toLocaleString('ja-JP', {
                  maximumFractionDigits: 2,
                })}
                {item.unit && ` ${item.unit}`}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
