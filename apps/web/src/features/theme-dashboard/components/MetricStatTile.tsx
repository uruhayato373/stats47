import type { ReactNode } from 'react';

import { cn } from '@stats47/components';
import { formatUnitForDisplay } from "@stats47/data-configs/unit";


import { RankBadge, rankToneByPosition } from '@/components/atoms/RankBadge';
import { SourcesSheet } from '@/components/charts/SourcesSheet';
import { StatTile } from '@/components/surface';

import { metricSourceGroups } from '../lib/metric-source-groups';

import { formatMetricValue, type MetricKpi } from './metric-kpi';


/**
 * テーマの指標 1 件の数値タイル (2026-10-29)。指標が 1 つのカード (SingleMetricCard) と、指標を切り替えるカード
 * (MetricSwitcherPanel) の値の行が同じ描き方になるよう、ここだけで StatTile に写す。
 *
 * - 県を選んでいるとき: その県の値 + 順位バッジ + 年
 * - 47都道府県 (未選択): 実在する 1 位県の値 (47 県平均でも全国値でもない) + 年・1 位の県名
 * - 右上に出典・指標の定義の Sheet を開く枠なしのアイコン (2026-10-30。旧: 下端の出典・ランキングのリンク行)。
 *   hideSources で外す (切り替えカードはチャートの下の Sheet に 1 か所でまとめる)。
 *   推移の小さなチャートは children で受け、出すかは呼び出し側が決める
 * - toggle を渡すと、タイル全体がグラフに系列を出し入れするボタンになる (見本の元の shadcn「Line Chart - Interactive」の
 *   数値のボタン。押している間は背景を muted にし、名前の左の色の印が凡例を兼ねる。2026-10-29)
 */
export interface MetricStatTileToggle {
  pressed: boolean;
  /** グラフの系列の色 (名前の左の印) */
  color: string;
  /** 押しても切り替わらない理由 (最後の 1 本・3 種類目の単位)。あれば aria-disabled と title で伝える */
  disabledReason?: string;
  onToggle: () => void;
}

export function MetricStatTile({
  metric,
  label,
  sourcesLabel,
  selectedPrefectureCode,
  children,
  hideSources = false,
  toggle,
}: {
  metric: MetricKpi;
  /** 指標の名前 (テーマの短い名前。グループ名を添えるときは呼び出し側で組み立てる) */
  label: ReactNode;
  /** 出典・指標の定義の Sheet に出す指標の名前 (タイルの名前と揃える。無ければ title) */
  sourcesLabel?: string;
  selectedPrefectureCode: string | null;
  children?: ReactNode;
  hideSources?: boolean;
  toggle?: MetricStatTileToggle;
}) {
  const shown = selectedPrefectureCode ? metric.value : metric.topRanked?.value ?? null;
  const meta = [
    metric.yearName,
    !selectedPrefectureCode && metric.topRanked ? `1位: ${metric.topRanked.areaName}` : null,
    // 問いの型「全国平均との差」: 県の値の横に全国の値を置く (全国行が無い指標は出さない。2026-10-31)
    selectedPrefectureCode && metric.value !== null && metric.nationalValue !== undefined
      ? `全国 ${formatMetricValue(metric.nationalValue)}`
      : null,
  ]
    .filter(Boolean)
    .join('・');

  const tile = (
    <StatTile
      className={cn('h-full', toggle?.pressed && 'bg-muted/50!')}
      label={
        toggle ? (
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn('inline-block h-[3px] w-4 shrink-0 rounded-full', !toggle.pressed && 'opacity-30')}
              style={{ backgroundColor: toggle.color }}
            />
            {label}
          </span>
        ) : (
          label
        )
      }
      value={shown !== null ? formatMetricValue(shown) : null}
      unit={metric.unit ? formatUnitForDisplay(metric.unit) : undefined}
      badge={
        selectedPrefectureCode && metric.rank !== null ? (
          <RankBadge rank={metric.rank} tone={rankToneByPosition(metric.rank, metric.total)} />
        ) : undefined
      }
      meta={meta || undefined}
      action={
        hideSources ? undefined : (
          <SourcesSheet
            groups={metricSourceGroups([metric], { [metric.metricKey]: sourcesLabel ?? metric.title })}
            trigger="icon"
          />
        )
      }
    >
      {children}
    </StatTile>
  );
  if (!toggle) return tile;

  // タイルの中の文字は読めるまま、上に全面のボタンを重ねる (button の中に dl を入れない)
  return (
    <div className="relative h-full">
      {tile}
      <button
        type="button"
        aria-pressed={toggle.pressed}
        aria-disabled={toggle.disabledReason ? true : undefined}
        aria-label={`${typeof label === 'string' ? label : metric.title}をグラフに表示`}
        title={toggle.disabledReason}
        onClick={toggle.onToggle}
        className={cn(
          'absolute inset-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          !toggle.pressed && 'hover:bg-muted/30',
          toggle.disabledReason && 'cursor-not-allowed'
        )}
      />
    </div>
  );
}
