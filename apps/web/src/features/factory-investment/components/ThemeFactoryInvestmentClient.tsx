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
import { FACTORY_INVESTMENT_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import type { FactoryInvestmentSnapshot } from '../lib/factory-investment-snapshot';

const format = (n: number) =>
  n.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
export function ThemeFactoryInvestmentClient({
  snapshot,
}: {
  snapshot: FactoryInvestmentSnapshot;
}) {
  const { selectedPrefectureCode, selectedAreaName } = useThemePrefecture();
  const rows = selectedPrefectureCode
    ? snapshot.rows.filter((row) => row.areaCode === selectedPrefectureCode)
    : snapshot.rows;
  const area = selectedPrefectureCode ? selectedAreaName : '全国・47都道府県';
  return (
    <div
      data-theme-component-key="factory-investment"
      data-data-state="ready"
      data-area-code={selectedPrefectureCode ?? '00000'}
    >
      <ChartPanel
        title="工場立地に伴う設備投資"
        description={`2024年 · ${area} · 百万円`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={FACTORY_INVESTMENT_SOURCE.title}
            sourceLink={FACTORY_INVESTMENT_SOURCE.url}
          />
        }
      >
        <p className="text-sm">
          全国（公式集計）：
          <span
            className="tabular-nums"
            data-national-value={snapshot.national}
          >
            {format(snapshot.national)}
          </span>{' '}
          百万円
        </p>
        <Table aria-label={`${area}の設備投資計画額`}>
          <TableCaption>
            県内全企業の年間投資実績とは異なります。非公表の3県には順位を付けません。
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">都道府県</TableHead>
              <TableHead scope="col" className="text-right">
                設備投資額（百万円）
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.areaCode}
                data-prefecture-code={row.areaCode}
                data-value-status={row.status}
              >
                <TableHead scope="row">{row.areaName}</TableHead>
                <TableCell
                  className="text-right tabular-nums"
                  data-value={row.value ?? undefined}
                >
                  {row.value === null ? '非公表（原表X）' : format(row.value)}
                </TableCell>
              </TableRow>
            ))}
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
