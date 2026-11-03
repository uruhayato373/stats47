'use client';

import { ChartPanel } from '@stats47/components';
import { TrendingUp } from 'lucide-react';

import { LineChartClient } from '@/components/stat-charts/components/charts/LineChart/LineChartClient';

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
  // 欠測 (null) は値を持たない行として渡し、線を途切れさせる
  const data = years.map((year, i) => ({
    category: String(year),
    ...Object.fromEntries(groups.flatMap((group) => {
      const value = series[group.code]?.[i];
      return typeof value === 'number' ? [[group.code, value]] : [];
    })),
  }));
  return (
    <ChartPanel title={title} icon={<TrendingUp />} footer={note}>
      <LineChartClient
        chartData={{
          xAxisKey: 'category',
          data,
          lines: groups.map((group) => ({ dataKey: group.code, name: `${group.label} (${group.count})`, color: group.color })),
          unit,
        }}
        height={360}
      />
    </ChartPanel>
  );
}
