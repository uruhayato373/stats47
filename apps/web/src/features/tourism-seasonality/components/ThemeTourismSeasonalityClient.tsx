'use client';

import dynamic from 'next/dynamic';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { getChartColor } from '@/components/charts/ChartPalette';
import { ChartPanel } from '@/components/charts/ChartPanel';
import { ChartSkeleton } from '@/components/stat-charts/components/shared/ChartSkeleton';
import type { LineChartData } from '@/components/stat-charts/types/visualization';

import { useThemePrefecture } from '@/features/theme-dashboard';

import type {
  TourismMonthlyPoint,
  TourismSeasonalitySnapshot,
} from '../lib/tourism-seasonality-snapshot';

const LineChartClient = dynamic(
  () => import('@/components/stat-charts/components/charts/LineChart/LineChartClient')
    .then((module) => module.LineChartClient),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface Props {
  snapshot: TourismSeasonalitySnapshot;
  notes: string[];
}

function hasObservedValue(
  point: TourismMonthlyPoint
): point is TourismMonthlyPoint & { value: number } {
  return point.value !== null;
}

export function ThemeTourismSeasonalityClient({ snapshot, notes }: Props) {
  const { selectedPrefectureCode, selectedAreaName } = useThemePrefecture();
  const selectedRows = selectedPrefectureCode
    ? snapshot.rows.filter((row) => row.areaCode === selectedPrefectureCode)
    : snapshot.national;
  const rows = selectedRows
    ? [...selectedRows].sort((a, b) => a.period.localeCompare(b.period))
    : null;
  const areaLabel = selectedPrefectureCode
    ? (selectedAreaName ?? '選択した都道府県')
    : '全国（公式集計）';
  const observedRows = rows?.filter(hasObservedValue) ?? [];
  const hasCompleteSeries = rows !== null && rows.length === 12 && observedRows.length === 12;
  const chartData: LineChartData = {
    xAxisKey: 'period',
    data: observedRows.map((point) => ({
      period: point.period,
      label: point.period,
      value: point.value,
    })),
    lines: [{ dataKey: 'value', name: areaLabel, color: getChartColor(0) }],
    unit: snapshot.unit,
  };
  // Explicit monthly ticks are needed: the shared chart defaults to five-year ticks.
  const xTickValues = [1, 4, 7, 10, 12].map(
    (month) => `${snapshot.year}-${String(month).padStart(2, '0')}`
  );

  return (
    <div
      data-theme-component-key="tourism-seasonality"
      data-theme-component-type="monthly-series"
      data-data-state={rows ? (hasCompleteSeries ? 'ready' : 'partial') : 'select-prefecture'}
      data-period-start={`${snapshot.year}-01`}
      data-period-end={`${snapshot.year}-12`}
      data-unit={snapshot.unit}
      data-series-count={rows ? 1 : 0}
    >
      <ChartPanel
        title="月別の延べ宿泊者数"
        description={`${snapshot.year}年の確定値 · ${areaLabel} · ${snapshot.unit}`}
        className="min-w-0"
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={snapshot.source.title}
            sourceLink={snapshot.source.url}
          />
        }
      >
        {!rows && (
          <p className="text-sm text-muted-foreground" role="status">
            公式全国の月別値がないため、都道府県を選択してご覧ください。
          </p>
        )}
        {rows && hasCompleteSeries && (
          <LineChartClient chartData={chartData} xTickValues={xTickValues} />
        )}
        {rows && !hasCompleteSeries && (
          <p className="text-sm text-muted-foreground" role="status">
            欠測月があるため折線は表示していません。確認できる月の値は表でご覧ください。
          </p>
        )}
        {rows && (
          <Table aria-label={`${areaLabel}の月別延べ宿泊者数`}>
            <TableCaption>
              {snapshot.year}年の確定値。0は観測された0人泊、欠測は「欠測」と表示します。
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="whitespace-nowrap">年月</TableHead>
                <TableHead scope="col" className="text-right">延べ宿泊者数（人泊）</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.period}>
                  <TableHead scope="row" className="whitespace-nowrap">{row.period}</TableHead>
                  <TableCell className="text-right tabular-nums">
                    {row.value === null ? (
                      <>
                        <span>欠測</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {row.missingReason}
                        </span>
                      </>
                    ) : row.value.toLocaleString('ja-JP')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </ChartPanel>
    </div>
  );
}
