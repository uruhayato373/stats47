'use client';
import Link from 'next/link';

import { Button } from '@stats47/components/atoms/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { SNOW_DESIGNATION_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import type { GeoAnalysisSnapshot } from '@stats47/gis';
export function snowNationalValues(
  snapshot: GeoAnalysisSnapshot
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const metric of snapshot.metrics) {
    if (metric.key === 'designatedCenterPopulationShare') continue;
    const scale = metric.key.toLowerCase().includes('population') ? 10000 : 1;
    totals[metric.key] =
      snapshot.rows.reduce(
        (sum, r) =>
          sum +
          (scale === 1
            ? Number(r.values[metric.key])
            : Math.round(Number(r.values[metric.key]) * scale)),
        0
      ) / scale;
  }
  totals.designatedCenterPopulationShare =
    (totals.designatedCenterPopulation! / totals.population2020!) * 100;
  return totals;
}
export function GeoSnowDesignationSummary({
  snapshot,
  selectedAreaCode,
  onSelectArea,
}: {
  snapshot: GeoAnalysisSnapshot;
  selectedAreaCode?: string | null;
  onSelectArea?: (code: string, name: string) => void;
}) {
  const selected = snapshot.rows.find((r) => r.areaCode === selectedAreaCode);
  const rows = selected
    ? [selected]
    : [
        {
          areaCode: '00000',
          areaName: '全国（47都道府県計）',
          rank: 0,
          values: snowNationalValues(snapshot),
        },
        ...[...snapshot.rows].sort((a, b) =>
          a.areaCode.localeCompare(b.areaCode)
        ),
      ];
  return (
    <ChartPanel
      title="豪雪指定区域と人口"
      description="2016年度の指定区域 · 2020年基準人口 · 250mメッシュ中心で判定"
      contentClassName="min-w-0 space-y-4"
      footer={
        <ChartFooter
          source={SNOW_DESIGNATION_SOURCE.snow.title}
          sourceLink={SNOW_DESIGNATION_SOURCE.snow.pageUrl}
        />
      }
    >
      <Table aria-label="豪雪指定区域に中心があるメッシュ人口と面積">
        <TableCaption>
          特別豪雪は指定区域全体の内数です。全国割合は県の割合を平均せず、人口を合計して計算しています。
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">地域</TableHead>
            {snapshot.metrics.map((m) => (
              <TableHead
                key={m.key}
                scope="col"
                className="text-right whitespace-nowrap"
              >
                {m.label}（{m.unit}）
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.areaCode} data-snow-area={r.areaCode}>
              <TableHead scope="row" className="whitespace-nowrap">
                {onSelectArea && !selected && r.areaCode !== '00000' ? (
                  <Button
                    variant="link"
                    className="h-11 p-0"
                    onClick={() => onSelectArea(r.areaCode, r.areaName)}
                  >
                    {r.areaName}
                  </Button>
                ) : (
                  r.areaName
                )}
              </TableHead>
              {snapshot.metrics.map((m) => (
                <TableCell
                  key={m.key}
                  className="text-right whitespace-nowrap tabular-nums"
                  data-snow-metric={m.key}
                  data-value={r.values[m.key] ?? undefined}
                >
                  {typeof r.values[m.key] === 'number'
                    ? Number(r.values[m.key]).toLocaleString('ja-JP', {
                        maximumFractionDigits: m.unit === '人' ? 4 : 3,
                      })
                    : '—'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
        {SNOW_DESIGNATION_SOURCE.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <p className="text-sm">
        <Link
          className="underline underline-offset-2"
          href={`/geo/population-snow-designation${selected ? `?pref=${selected.areaCode.slice(0, 2)}` : ''}`}
        >
          指定区域・人口メッシュ・計算の根拠を見る
        </Link>
        {' · '}
        <a
          className="underline underline-offset-2"
          href={SNOW_DESIGNATION_SOURCE.population.pageUrl}
        >
          人口メッシュの出典
        </a>
      </p>
    </ChartPanel>
  );
}
