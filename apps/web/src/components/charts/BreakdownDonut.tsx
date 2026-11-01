'use client';

import dynamic from 'next/dynamic';

import { formatUnitForDisplay } from '@stats47/data-configs/unit';
import { formatValueWithPrecision, resolveValuePrecision } from '@stats47/utils';

import { ChartLegend } from './ChartLegend';

const DonutChart = dynamic(
  () => import('@stats47/visualization/d3/DonutChart').then((mod) => mod.DonutChart),
  { ssr: false }
);

export interface BreakdownItem {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * 内訳の図 (ドーナツ + 名前・値・割合の一覧)。見本の内訳のカード (shadcndashboard の Sales Distribution) と同じ並び。
 * 図は共通のドーナツ (`@stats47/visualization` の DonutChart)、一覧は共通の凡例 (`ChartLegend` の list) で描く。
 * テーマの構成比 (composition-chart) とドーナツ (donut-chart) はこの部品 1 つで描く (2026-11-01。旧: それぞれが円と一覧を手書きし、
 * 見た目が 2 通りあった)。一覧だけ使う所 (構成比の推移の下) は BreakdownList を使う
 */
export function BreakdownDonut({ items, unit }: { items: readonly BreakdownItem[]; unit?: string }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-3" data-chart="breakdown-donut">
      <DonutChart
        data={items.map((item) => ({ name: item.label, value: item.value, color: item.color }))}
        width={200}
        height={200}
        // 割合は下の一覧が示すので、輪の上には文字を置かない
        labelThreshold={1}
      />
      <BreakdownList items={items} unit={unit} className="w-full border-t pt-2" />
    </div>
  );
}

/** 内訳の一覧 (名前・値・割合)。合計に対する割合を出す */
export function BreakdownList({
  items,
  unit,
  className,
}: {
  items: readonly BreakdownItem[];
  unit?: string;
  className?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  // 小数の桁は一覧の値から 1 度だけ決め、全行でそろえる
  const precision = resolveValuePrecision(items.map((item) => item.value));
  return (
    <ChartLegend
      layout="list"
      className={className}
      items={items.map((item) => ({
        key: item.key,
        label: item.label,
        color: item.color,
        value: (
          <span className="flex items-baseline gap-3 tabular-nums">
            <span className="font-semibold">
              {formatValueWithPrecision(item.value, precision)}
              {unit ? <span className="ml-0.5 text-xs font-normal text-muted-foreground">{formatUnitForDisplay(unit)}</span> : null}
            </span>
            <span className="w-14 text-right text-muted-foreground">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'}%
            </span>
          </span>
        ),
      }))}
    />
  );
}
