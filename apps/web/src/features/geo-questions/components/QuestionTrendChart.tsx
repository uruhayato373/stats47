'use client';

import dynamic from 'next/dynamic';

import { ChartPanel } from '@stats47/components';
import { TrendingUp } from 'lucide-react';

import type { D3LineChartProps } from '@stats47/visualization/d3';

const LineChart = dynamic<D3LineChartProps>(
  () => import('@stats47/visualization/d3/LineChart').then((mod) => mod.D3LineChart),
  { ssr: false },
);

interface QuestionTrendChartProps {
  readonly title: string;
  readonly note: string;
  readonly unit: string;
  readonly years: readonly number[];
  readonly groups: readonly { code: string; label: string; color: string; count: number }[];
  readonly series: Readonly<Record<string, readonly (number | null)[]>>;
}

/** 組ごとの推移 (問いの答えの主役)。組の数を凡例の名前に添える */
export function QuestionTrendChart({ title, note, unit, years, groups, series }: QuestionTrendChartProps) {
  const data = years.map((year, i) => ({
    category: String(year),
    ...Object.fromEntries(groups.map((group) => [group.code, series[group.code]?.[i] ?? null])),
  }));
  return (
    <ChartPanel title={title} icon={<TrendingUp />} footer={note}>
      <LineChart
        data={data}
        series={groups.map((group) => ({ dataKey: group.code, name: `${group.label} (${group.count})`, color: group.color }))}
        showLegend
        unit={unit}
        height={360}
      />
    </ChartPanel>
  );
}
