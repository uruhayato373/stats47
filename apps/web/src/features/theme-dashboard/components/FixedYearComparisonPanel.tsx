'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';

import { lookupArea } from '@stats47/area';
import { Button } from '@stats47/components/atoms/ui/button';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';
import { RankingBarList } from '@/components/charts/RankingBarList';


import { ChartEmptyState } from './ChartState';
import { ScrollableRow } from './ScrollableRow';
import { SingleYearSeriesTable } from './SingleYearSeriesTable';

import type { ThemeIndicatorData } from '../types';
import type { MetricKpi } from './metric-kpi';

const TileGridMap = dynamic(() => import('@stats47/visualization/d3/TileGridMapChart').then((module) => module.TileGridMap), { ssr: false });
const MAP_COLORS = { colorScheme: 'interpolateBlues', colorSchemeType: 'sequential' as const, minValueType: 'data-min' as const };

/** Compare observed prefecture values in an explicitly selected survey year. */
export function FixedYearComparisonPanel({
  title,
  metrics,
  comparisonYear,
  indicatorDataMap,
  selectedPrefectureCode,
  defaultMetricKey,
  tabLabels = {},
  showMap = false,
}: {
  title?: string;
  metrics: MetricKpi[];
  comparisonYear: string;
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  selectedPrefectureCode: string | null;
  defaultMetricKey?: string;
  tabLabels?: Record<string, string>;
  showMap?: boolean;
}) {
  const [selectedKey, setSelectedKey] = useState(defaultMetricKey);
  const [view, setView] = useState('table');
  const metric = metrics.find((item) => item.metricKey === selectedKey) ?? metrics[0];
  if (!metric) return null;

  // The loader also selects this year. Check at the rendering boundary so a stale
  // or differently configured snapshot cannot silently substitute its latest year.
  const cohort = (indicatorDataMap[metric.metricKey]?.rankingValues ?? [])
    .filter((row) => String(row.yearCode).slice(0, 4) === comparisonYear)
    .filter((row) => typeof row.value === 'number' && Number.isFinite(row.value))
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.areaCode.localeCompare(b.areaCode));
  const values = cohort.filter((row) => !selectedPrefectureCode || row.areaCode === selectedPrefectureCode);
  const rows = values.map((row) => ({
    year: row.yearName || `${comparisonYear}年`,
    [row.areaCode]: row.value as number,
  }));
  const series = values.map((row) => ({
    dataKey: row.areaCode,
    name: lookupArea(row.areaCode)?.areaName ?? row.areaCode,
    unit: row.unit || metric.unit,
  }));

  return (
    <ChartPanel
      title={title}
      footer={
        <ChartFooter
          source={metric.sourceName}
          sourceLink={metric.sourceLink}
          sourceLinks={metric.sourceLinks}
          rankingLink={`/ranking/${metric.metricKey}`}
          rankingLabel="指標の定義・ランキング"
        />
      }
    >
      {metrics.length > 1 && (
        <ScrollableRow className="mb-3">
          <div className="flex gap-2">
            {metrics.map((item) => (
              <Button
                key={item.metricKey}
                variant={item.metricKey === metric.metricKey ? 'default' : 'outline'}
                size="sm"
                aria-pressed={item.metricKey === metric.metricKey}
                onClick={() => setSelectedKey(item.metricKey)}
                className="shrink-0"
              >
                {tabLabels[item.metricKey] ?? item.title}
              </Button>
            ))}
          </div>
        </ScrollableRow>
      )}
      <div className="mb-3 flex gap-2" role="group" aria-label="比較の表示形式">
        {[['table', '表'], ['bar', '棒グラフ'], ...(showMap ? [['map', 'タイル地図']] : [])].map(([key, label]) => (
          <Button key={key} size="sm" variant={view === key ? 'default' : 'outline'} aria-pressed={view === key} onClick={() => setView(key)}>{label}</Button>
        ))}
      </div>
      {values.length > 0 ? (
        view === 'map' && showMap ? (
          <div role="img" aria-label={`${comparisonYear}年の${metric.title}・47都道府県のタイル地図`}>
            <TileGridMap data={cohort.map((row) => ({ areaCode: row.areaCode, value: row.value as number }))} colorConfig={MAP_COLORS} width={600} height={720} unit={metric.unit} selectedPrefectureCode={selectedPrefectureCode ?? undefined} />
            <p className="text-xs text-muted-foreground">{cohort[0]?.yearName ?? `${comparisonYear}年`}。淡い色から濃い色へ：{Math.min(...cohort.map((row) => row.value as number))}〜{Math.max(...cohort.map((row) => row.value as number))} {metric.unit}。位置は模式的に示しています。</p>
          </div>
        ) : view === 'bar' ? (
          <div className="max-h-96 overflow-y-auto" tabIndex={0} role="region" aria-label={`${comparisonYear}年の${metric.title}の棒グラフ`}>
            <RankingBarList items={values.map((row) => ({ key: row.areaCode, areaCode: row.areaCode, value: row.value as number, rank: row.rank }))} max={Math.max(...cohort.map((row) => row.value as number))} unit={metric.unit} valueMaximumFractionDigits={2} valueClassName="w-36" />
          </div>
        ) : <div className="max-h-96 overflow-y-auto" tabIndex={0} role="region" aria-label={`${metric.title}の県別比較表`}>
          <SingleYearSeriesTable
            rows={rows}
            series={series}
            yearKey="year"
            nameColumnLabel="都道府県"
            ariaLabel={`${comparisonYear}年の都道府県比較`}
          />
        </div>
      ) : (
        <ChartEmptyState message={`${comparisonYear}年の観測値がありません`} />
      )}
    </ChartPanel>
  );
}
