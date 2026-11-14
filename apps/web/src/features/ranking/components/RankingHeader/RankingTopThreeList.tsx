'use client';

import { ChartPanel } from '@stats47/components';
import { formatUnitForDisplay } from '@stats47/data-configs/unit';
import { Trophy } from 'lucide-react';

import { getMetricChartColor } from '@/components/charts/ChartPalette';
import { ValueDotPlot } from '@/components/charts/ValueDotPlot';

import {
  formatRankingValue,
  type RankingHeaderStats,
} from '../../utils/compute-ranking-header-stats';

import type { MetricPresentation } from '@stats47/types';

interface RankingTopThreeListProps {
  stats: RankingHeaderStats;
  unit: string;
  /**
   * 小数桁。**47 県全体から解決した値**を呼び元 (RankingHeaderStats) が渡す。
   * ここで items から解決すると、上位3件と下位3件を別リストで描くため
   * 2 つのリストで桁数が食い違いうる (2026-07-31)。
   */
  precision: number;
  /** 表示単位への倍率 (ページが決めた表示単位があるとき)。値は元の単位のまま受け取る */
  factor?: number;
  presentation: Pick<MetricPresentation, 'colorScheme' | 'comparisonDomain'>;
}

/**
 * 上位 3 件と下位 3 件を 1 枚にまとめたリスト。
 *
 * 共通の数値軸上の点で値の位置と差を示す。平均は点のツールチップで読む。
 */
export function RankingTopThreeList({
  stats,
  unit,
  precision,
  factor = 1,
  presentation,
}: RankingTopThreeListProps) {
  const { top3, bottom3 } = stats;
  if (top3.length === 0) return null;

  // 小件数でも同じ地域を二度表示しない。同順位の別地域はそれぞれ表示する。
  const bottomEntries = bottom3.filter((entry) => !top3.some((top) => top.areaCode === entry.areaCode));
  const entries = [...top3, ...bottomEntries];
  const title = `上位${top3.length}件${bottomEntries.length ? `と下位${bottomEntries.length}件` : ''}`;
  const formatValue = (value: number) => formatRankingValue(value, precision, factor);
  return (
    <ChartPanel
      title={title}
      icon={<Trophy />}
      action={
        unit ? (
          <span className="text-xs text-muted-foreground">
            単位: {formatUnitForDisplay(unit)}
          </span>
        ) : undefined
      }
      contentClassName="flex flex-1 flex-col gap-2"
    >
      <ValueDotPlot
        items={entries.map((entry) => ({
          key: entry.areaCode,
          label: entry.areaName,
          rank: entry.rank,
          value: entry.value,
        }))}
        values={entries.map((entry) => entry.value)}
        reference={stats.average}
        policy={presentation.comparisonDomain}
        formatValue={formatValue}
        color={getMetricChartColor(presentation)}
        unit={formatUnitForDisplay(unit)}
        showAxes={false}
        showReferenceLine={false}
        fillHeight
      />
    </ChartPanel>
  );
}
