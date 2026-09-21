import { notFound } from 'next/navigation';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';

import {
  GeoCrossAnalysisArticle,
  GEO_CROSS_ANALYSIS_CONFIGS,
  GEO_DEFAULT_PREF_CODE,
  isGeoCrossAnalysisSlug,
  isGeoSpatialView,
} from '@/features/geo-analysis';
import { ThemeStationPassengersSection } from '@/features/station-passengers';

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ analysisSlug: string }>;
  searchParams: Promise<{ pref?: string; stage?: string; group?: string }>;
}

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { analysisSlug } = await params;
  if (!isGeoCrossAnalysisSlug(analysisSlug)) return {};
  const config = GEO_CROSS_ANALYSIS_CONFIGS[analysisSlug];
  return {
    title: `${config.shortTitle} | stats47地域分析`,
    description: config.description,
    alternates: { canonical: `/geo/${analysisSlug}` },
  };
}

export default async function GeoCrossAnalysisPage({
  params,
  searchParams,
}: PageProps) {
  const { analysisSlug } = await params;
  if (!isGeoCrossAnalysisSlug(analysisSlug)) notFound();
  const query = await searchParams;
  const prefCode = PREFECTURE_LIST_2DIGIT.some(
    (prefecture) => prefecture.code === query.pref
  )
    ? (query.pref ?? GEO_DEFAULT_PREF_CODE)
    : GEO_DEFAULT_PREF_CODE;
  // Every analysis lands on the overlap map; other stages stay reachable by URL.
  const stage = isGeoSpatialView(query.stage, analysisSlug)
    ? query.stage
    : 'overlap';

  return (
    <GeoCrossAnalysisArticle
      slug={analysisSlug}
      initialPrefCode={prefCode}
      initialStage={stage}
      initialFacilityGroup={
        query.group === 'meeting' ? 'meeting' : 'administrative'
      }
      contextLayer={
        analysisSlug === 'population-station-access' ? (
          <ThemeStationPassengersSection initialPrefCode={prefCode} />
        ) : undefined
      }
    />
  );
}
