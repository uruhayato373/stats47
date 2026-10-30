import type { ReactNode } from 'react';

import { cn } from '@stats47/components';
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
 * - 下端に出典・ランキングのリンク行 (hideFooter で外す。切り替えカードはチャートの下の Sheet に 1 か所でまとめる)。
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
  selectedPrefectureCode,
  children,
  hideFooter = false,
  toggle,
}: {
  metric: MetricKpi;
  /** 指標の名前 (テーマの短い名前。グループ名を添えるときは呼び出し側で組み立てる) */
  label: ReactNode;
  selectedPrefectureCode: string | null;
  children?: ReactNode;
  hideFooter?: boolean;
  toggle?: MetricStatTileToggle;
}) {
  const shown = selectedPrefectureCode ? metric.value : metric.topRanked?.value ?? null;
  const meta = [
    metric.yearName,
    !selectedPrefectureCode && metric.topRanked ? `1位: ${metric.topRanked.areaName}` : null,
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
      value={shown !== null ? shown.toLocaleString('ja-JP', { maximumFractionDigits: 2 }) : null}
      unit={metric.unit ? formatUnitForDisplay(metric.unit) : undefined}
      badge={
        selectedPrefectureCode && metric.rank !== null ? (
          <RankBadge rank={metric.rank} tone={rankToneByPosition(metric.rank, metric.total)} />
        ) : undefined
      }
      meta={meta || undefined}
      footer={
        hideFooter ? undefined : (
        <ChartFooter
          source={metric.sourceName}
          sourceLink={metric.sourceLink}
          sourceLinks={metric.sourceLinks}
          rankingLink={hrefFor("ranking", { rankingKey: metric.metricKey })}
          rankingLabel="ランキングを見る"
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
