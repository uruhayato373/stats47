'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { PHYSICAL_ACTIVITY_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import type { PhysicalActivitySnapshot } from '../lib/physical-activity-snapshot';

const format = (value: number) =>
  value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });

export function ThemePhysicalActivityClient({
  snapshot,
}: {
  snapshot: PhysicalActivitySnapshot;
}) {
  const { selectedPrefectureCode, selectedAreaName } = useThemePrefecture();
  const rows = selectedPrefectureCode
    ? snapshot.rows.filter((row) => row.areaCode === selectedPrefectureCode)
    : snapshot.national;
  const area = selectedPrefectureCode ? selectedAreaName : '全国（公式集計）';

  return (
    <div
      data-theme-component-key="physical-activity"
      data-data-state="ready"
      data-area-code={selectedPrefectureCode ?? '00000'}
    >
      <ChartPanel
        title="歩数と推計の幅"
        description={`2024年 · ${area} · 20〜64歳、男女とも46歳に年齢調整`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={PHYSICAL_ACTIVITY_SOURCE.title}
            sourceLink={PHYSICAL_ACTIVITY_SOURCE.url}
          />
        }
      >
        <Table aria-label={`${area}の歩数と95%信頼区間`}>
          <TableCaption>
            平均と95%信頼区間は1日当たりの歩数です。集計人数は推計人口ではありません。
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">指標</TableHead>
              <TableHead scope="col" className="text-right">
                平均
                <br />
                （歩/日）
              </TableHead>
              <TableHead scope="col" className="text-right">
                95%信頼区間
                <br />
                （歩/日）
              </TableHead>
              <TableHead scope="col" className="text-right">
                集計
                <br />
                人数
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PHYSICAL_ACTIVITY_SOURCE.metrics.map((metric) => {
              const row = rows.find((point) => point.metricKey === metric.key)!;
              return (
                <TableRow key={metric.key} data-metric-key={metric.key}>
                  <TableHead scope="row">{metric.label}</TableHead>
                  <TableCell
                    className="text-right tabular-nums"
                    data-mean={row.mean}
                  >
                    {format(row.mean)}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    data-lower95={row.lower95}
                    data-upper95={row.upper95}
                  >
                    {format(row.lower95)}〜{format(row.upper95)}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    data-sample-size={row.sampleSize}
                  >
                    {row.sampleSize.toLocaleString('ja-JP')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {snapshot.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </ChartPanel>
    </div>
  );
}
