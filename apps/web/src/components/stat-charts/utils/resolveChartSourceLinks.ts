import { METRICS_REGISTRY } from '@stats47/data-configs';
import { resolveSurveyTaxonomy } from '@stats47/ranking';

import type { ChartFooterLink } from '@/components/charts/ChartFooter';

interface ChartLineageInput {
  rankingLink?: string | null;
  rankingLinks?: unknown;
  relatedRankingKeys?: readonly string[];
}

function rankingKeyFromUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.match(/^\/ranking\/([^/?#]+)/)?.[1] ?? null;
}

/**
 * page component / databook chart の既存 ranking 導線を調査 taxonomy へ接続する。
 * surveyId の対応表を UI 側に増やさず、metric registry の lineage だけを正典にする。
 */
export function resolveChartSourceLinks({
  rankingLink,
  rankingLinks,
  relatedRankingKeys,
}: ChartLineageInput): ChartFooterLink[] {
  const secondaryKeys = Array.isArray(rankingLinks)
    ? rankingLinks.flatMap((item) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          return [];
        }
        const key = rankingKeyFromUrl((item as Record<string, unknown>).url);
        return key ? [key] : [];
      })
    : [];
  const primaryKey = rankingKeyFromUrl(rankingLink);
  const metricKeys = [
    ...(relatedRankingKeys ?? []),
    ...(primaryKey ? [primaryKey] : []),
    ...secondaryKeys,
  ];
  if (metricKeys.length === 0) return [];

  return resolveSurveyTaxonomy(
    { metricKeys: [...new Set(metricKeys)] },
    METRICS_REGISTRY
  ).surveys.map((survey) => ({
    label: survey.name,
    url: `/survey/${survey.id}`,
  }));
}
