'use client';

import { ChartPanel } from '@stats47/components';
import { FACTORY_INVESTMENT_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ValueTable } from '@/components/surface';

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
  // 県のページはその県の行だけ。全国のページは全国の合計だけを出す (47 都道府県を並べない。2026-10-31)
  const rows = selectedPrefectureCode
    ? snapshot.rows.filter((row) => row.areaCode === selectedPrefectureCode)
    : [];
  const area = selectedPrefectureCode ? selectedAreaName : '全国';
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
        <ValueTable
          ariaLabel={`${area}の設備投資計画額`}
          caption="県内全企業の年間投資実績とは異なります。非公表の3県には順位を付けません。"
          columns={[
            { key: 'area', header: '都道府県', rowHeader: true },
            { key: 'value', header: '設備投資額（百万円）' },
          ]}
          rows={rows.map((row) => ({
            key: row.areaCode,
            attrs: {
              'data-prefecture-code': row.areaCode,
              'data-value-status': row.status,
            },
            cells: [
              row.areaName,
              {
                content: row.value === null ? '非公表（原表X）' : format(row.value),
                attrs: { 'data-value': row.value ?? undefined },
              },
            ],
          }))}
        />
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {snapshot.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </ChartPanel>
    </div>
  );
}
