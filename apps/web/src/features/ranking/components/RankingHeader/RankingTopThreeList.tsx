'use client';

import { formatUnitForDisplay, parseUnit } from '@stats47/data-configs/unit';

import { ValueDotPlot } from '@/components/charts/ValueDotPlot';
import { SurfaceCard } from '@/components/surface';

import {
  formatRankingValue,
  type RankingHeaderStats,
} from '../../utils/compute-ranking-header-stats';

import type { NumericDomainPolicy } from '@stats47/types';

interface RankingTopThreeListProps {
  stats: RankingHeaderStats;
  unit: string;
  /**
   * 小数桁。**47 県全体から解決した値**を呼び元 (RankingHeaderStats) が渡す。
   * ここで items から解決すると、上位3件と最下位を別リストで描くため
   * 2 つのリストで桁数が食い違いうる (2026-07-31)。
   */
  precision: number;
  domainPolicy: NumericDomainPolicy;
}

/**
 * 上位 3 件と最下位を 1 枚にまとめたリスト。
 *
 * 共通の数値軸上の点で値の位置と差を示す。破線は単純平均。
 */
export function RankingTopThreeList({
  stats,
  unit,
  precision,
  domainPolicy,
}: RankingTopThreeListProps) {
  const { top3, last } = stats;
  if (top3.length === 0) return null;

  // 最下位が上位 3 件に含まれる (県数が極端に少ない指標) なら重複表示しない
  const showLast =
    last != null && !top3.some((e) => e.areaCode === last.areaCode);
  const entries = [...top3, ...(showLast ? [last] : [])];
  const gapUnit =
    parseUnit(unit).dimension === 'percent' ? 'pt' : formatUnitForDisplay(unit);
  const formatValue = (value: number) => formatRankingValue(value, precision);
  return (
    <SurfaceCard className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          上位3件{showLast ? 'と最下位' : ''}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground">
            単位: {formatUnitForDisplay(unit)}
          </span>
        )}
      </div>
      <ValueDotPlot
        items={entries.map((entry) => ({
          key: entry.areaCode,
          label: entry.areaName,
          rank: entry.rank,
          value: entry.value,
        }))}
        values={entries.map((entry) => entry.value)}
        reference={stats.average}
        policy={domainPolicy}
        formatValue={formatValue}
      />
      {top3.length > 1 && (
        <p className="text-xs text-muted-foreground">
          {top3[0].rank === top3[1].rank
            ? '上位2件は同順位（差なし）'
            : `${top3[0].rank}位と${top3[1].rank}位の差`}{' '}
          {top3[0].rank !== top3[1].rank && (
            <span className="font-medium text-foreground tabular-nums">
              {formatValue(top3[0].value - top3[1].value)}
              {gapUnit}
            </span>
          )}
        </p>
      )}
    </SurfaceCard>
  );
}
