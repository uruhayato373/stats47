import type { ReactNode } from 'react';

import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { RankBadge, rankToneByPosition } from '@/components/atoms/RankBadge';
import { ChartFooter } from '@/components/charts/ChartFooter';
import { StatTile } from '@/components/surface';

import type { MetricKpi } from './metric-kpi';

/**
 * テーマの指標 1 件の数値タイル (2026-10-29)。指標が 1 つのカード (SingleMetricCard) と、指標を切り替えるカード
 * (MetricSwitcherPanel) の値の行が同じ描き方になるよう、ここだけで StatTile に写す。
 *
 * - 県を選んでいるとき: その県の値 + 順位バッジ + 年
 * - 47都道府県 (未選択): 実在する 1 位県の値 (47 県平均でも全国値でもない) + 年・1 位の県名
 * - 下端に出典・ランキングのリンク行。推移の小さなチャートは children で受け、出すかは呼び出し側が決める
 */
export function MetricStatTile({
  metric,
  label,
  selectedPrefectureCode,
  children,
}: {
  metric: MetricKpi;
  /** 指標の名前 (テーマの短い名前。グループ名を添えるときは呼び出し側で組み立てる) */
  label: ReactNode;
  selectedPrefectureCode: string | null;
  children?: ReactNode;
}) {
  const shown = selectedPrefectureCode ? metric.value : metric.topRanked?.value ?? null;
  const meta = [
    metric.yearName,
    !selectedPrefectureCode && metric.topRanked ? `1位: ${metric.topRanked.areaName}` : null,
  ]
    .filter(Boolean)
    .join('・');

  return (
    <StatTile
      className="h-full"
      label={label}
      value={shown !== null ? shown.toLocaleString('ja-JP', { maximumFractionDigits: 2 }) : null}
      unit={metric.unit ? formatUnitForDisplay(metric.unit) : undefined}
      badge={
        selectedPrefectureCode && metric.rank !== null ? (
          <RankBadge rank={metric.rank} tone={rankToneByPosition(metric.rank, metric.total)} />
        ) : undefined
      }
      meta={meta || undefined}
      footer={
        <ChartFooter
          source={metric.sourceName}
          sourceLink={metric.sourceLink}
          sourceLinks={metric.sourceLinks}
          rankingLink={hrefFor("ranking", { rankingKey: metric.metricKey })}
          rankingLabel="ランキングを見る"
        />
      }
    >
      {children}
    </StatTile>
  );
}
