import { notFound } from 'next/navigation';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { resolveGeoStageRoute } from '@stats47/data-configs/business-plan';

import {
  GeoCrossAnalysisArticle,
  GEO_CROSS_ANALYSIS_CONFIGS,
  isGeoCrossAnalysisSlug,
  isGeoStationAccessView,
} from '@/features/geo-analysis';

import type { Metadata } from 'next';

type Props = {
  params: Promise<{ analysisSlug: string; prefCode: string; stage: string }>;
};
export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { analysisSlug, prefCode, stage } = await params;
  const route = resolveGeoStageRoute(
    `/geo/${analysisSlug}/${prefCode}/${stage}`
  );
  const prefecture = PREFECTURE_LIST_2DIGIT.find((p) => p.code === prefCode);
  return {
    title: isGeoCrossAnalysisSlug(analysisSlug)
      ? `${prefecture?.name ?? ''}｜${GEO_CROSS_ANALYSIS_CONFIGS[analysisSlug].shortTitle}`
      : '地域分析',
    alternates: {
      canonical:
        route?.kind === 'landing'
          ? route.canonical
          : isGeoCrossAnalysisSlug(analysisSlug)
            ? `/geo/${analysisSlug}`
            : '/geo',
    },
    robots: { index: route?.kind === 'landing', follow: true },
  };
}

export default async function GeoSpatialStagePage({ params }: Props) {
  const { analysisSlug, prefCode, stage } = await params;
  if (
    !isGeoCrossAnalysisSlug(analysisSlug) ||
    !PREFECTURE_LIST_2DIGIT.some((p) => p.code === prefCode) ||
    !isGeoStationAccessView(stage)
  )
    notFound();
  return (
    <GeoCrossAnalysisArticle
      slug={analysisSlug}
      initialPrefCode={prefCode}
      initialStage={stage}
    />
  );
}
