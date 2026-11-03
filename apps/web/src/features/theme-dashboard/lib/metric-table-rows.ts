import { hrefFor } from '@stats47/data-configs/content/href';
import { formatUnitForDisplay } from '@stats47/data-configs/unit';

import type { MetricRowTableRow } from '@/components/surface';

import { formatMetricValue, type MetricKpi } from '../components/metric-kpi';


function percentDiff(value: number, base: number): string {
  const percent = Math.round((value / base - 1) * 100);
  return percent === 0 ? '±0%' : `${percent > 0 ? '+' : ''}${percent}%`;
}

/**
 * 項目の多いグループ (view "table") を共通の表 (MetricRowTable) の行にする (2026-11-03)。
 * 県のページ = 値・全国順位・全国の値・全国との差、全国のページ = 値だけ。
 * 全国の値がどの行にも無い表は、全国・全国との差の列を出さない (「—」だけの列を作らない)。
 */
export function buildMetricTableRows(
  metrics: readonly MetricKpi[],
  labels: Readonly<Record<string, string>>,
  isPrefecture: boolean
): { extraHeaders: string[]; rows: MetricRowTableRow[] } {
  const shown = metrics.filter((metric) => metric.value !== null);
  const hasNational = isPrefecture && shown.some((metric) => metric.nationalValue !== undefined);
  const extraHeaders = [...(isPrefecture ? ['全国順位'] : []), ...(hasNational ? ['全国', '全国との差'] : [])];
  const rows = shown.map((metric): MetricRowTableRow => {
    const value = metric.value as number;
    const national = metric.nationalValue;
    return {
      key: metric.metricKey,
      label: labels[metric.metricKey] ?? metric.title,
      href: hrefFor('ranking', { rankingKey: metric.metricKey }),
      year: metric.yearName,
      value: formatMetricValue(value, metric.precision),
      unit: metric.unit ? formatUnitForDisplay(metric.unit) : undefined,
      cells: [
        ...(isPrefecture ? [metric.rank !== null ? `${metric.rank}位` : '—'] : []),
        ...(hasNational
          ? [
              national !== undefined ? formatMetricValue(national, metric.precision) : '—',
              national ? percentDiff(value, national) : '—',
            ]
          : []),
      ],
    };
  });
  return { extraHeaders, rows };
}
