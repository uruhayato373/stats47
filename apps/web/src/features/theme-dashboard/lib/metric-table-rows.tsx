import { hrefFor } from '@stats47/data-configs/content/href';

import Link from '@/components/atoms/SiteLink';
import type { ValueTableColumn, ValueTableRow } from '@/components/surface';

import { formatMetricValue, metricDisplayUnit, type MetricKpi } from '../components/metric-kpi';

function percentDiff(value: number, base: number): string {
  const percent = Math.round((value / base - 1) * 100);
  return percent === 0 ? '±0%' : `${percent > 0 ? '+' : ''}${percent}%`;
}

/**
 * 項目の多いグループ (view "table") を共通の静的な表 (ValueTable) の列と行にする (2026-11-03)。
 * 1 列目の見出しはグループ名 (章の中では枠の見出しの帯を置かないので、ここで何の表かを示す)。年は行ごとに小さく添える。
 * 県のページ = 値・全国順位・全国の値・全国との差、全国のページ = 値だけ。
 * 全国の値がどの行にも無い表は、全国・全国との差の列を出さない (「—」だけの列を作らない)。
 */
export function buildMetricTableRows(
  metrics: readonly MetricKpi[],
  labels: Readonly<Record<string, string>>,
  isPrefecture: boolean,
  groupTitle = '指標'
): { columns: ValueTableColumn[]; rows: ValueTableRow[] } {
  const shown = metrics.filter((metric) => metric.value !== null);
  const hasNational = isPrefecture && shown.some((metric) => metric.nationalValue !== undefined);
  const columns: ValueTableColumn[] = [
    { key: 'metric', header: groupTitle, rowHeader: true },
    { key: 'value', header: '値' },
    ...(isPrefecture ? [{ key: 'rank', header: '全国順位' }] : []),
    ...(hasNational ? [{ key: 'national', header: '全国' }, { key: 'diff', header: '全国との差' }] : []),
  ];
  const rows = shown.map((metric): ValueTableRow => {
    const value = metric.value as number;
    const national = metric.nationalValue;
    const unit = metricDisplayUnit(metric);
    return {
      key: metric.metricKey,
      cells: [
        <>
          <Link href={hrefFor('ranking', { rankingKey: metric.metricKey })}>{labels[metric.metricKey] ?? metric.title}</Link>
          {metric.yearName && <small className="block">{metric.yearName}</small>}
        </>,
        <>
          {formatMetricValue(value, metric.precision, metric.displayScale)}
          {unit && <small className="ml-0.5">{unit}</small>}
        </>,
        ...(isPrefecture ? [metric.rank !== null ? `${metric.rank}位` : '—'] : []),
        ...(hasNational
          ? [
              national !== undefined ? formatMetricValue(national, metric.precision, metric.displayScale) : '—',
              national ? percentDiff(value, national) : '—',
            ]
          : []),
      ],
    };
  });
  return { columns, rows };
}
