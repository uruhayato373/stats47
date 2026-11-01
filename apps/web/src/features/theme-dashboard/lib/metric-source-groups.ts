import { hrefFor } from '@stats47/data-configs/content/href';

import type { SourcesSheetGroup } from '@/components/charts/SourcesSheet';

import type { MetricKpi } from '../components/metric-kpi';

/**
 * テーマの指標ごとの出典と指標の定義・ランキングへのリンクを、出典の Sheet (SourcesSheet) の区切りにする。
 * 調査ハブ (sourceLinks) を優先し、無ければ出典名とそのリンク。
 */
export function metricSourceGroups(
  metrics: readonly MetricKpi[],
  /** rankingKey → 短い名前 (無ければ title) */
  labels: Record<string, string>
): SourcesSheetGroup[] {
  return metrics.map((metric) => ({
    title: labels[metric.metricKey] ?? metric.title,
    sources: metric.sourceLinks?.length
      ? metric.sourceLinks
      : metric.sourceName
        ? [{ label: metric.sourceName, url: metric.sourceLink }]
        : [],
    rankings: [
      { label: '指標の定義・ランキングを見る', url: hrefFor('ranking', { rankingKey: metric.metricKey }) },
    ],
  }));
}
