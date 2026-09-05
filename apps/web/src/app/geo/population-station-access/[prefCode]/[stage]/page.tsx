import { notFound } from 'next/navigation';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { resolveGeoStageRoute } from '@stats47/data-configs/business-plan';

import {
  GeoCrossAnalysisArticle,
  isGeoStationAccessView,
} from '@/features/geo-analysis';
import { ThemeStationPassengersSection } from '@/features/station-passengers';

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ prefCode: string; stage: string }>;
}

export const revalidate = 86400;

const STAGE_LABELS = {
  population: '1km将来人口',
  overlap: '駅800m圏との重なり',
  audit: '集計検算',
} as const;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { prefCode, stage } = await params;
  const prefecture = PREFECTURE_LIST_2DIGIT.find(
    (candidate) => candidate.code === prefCode
  );
  const isValidStage = isGeoStationAccessView(stage);
  const path = '/geo/population-station-access/' + prefCode + '/' + stage;
  const isPublishedXLanding =
    Boolean(prefecture && isValidStage) &&
    resolveGeoStageRoute(path)?.kind === 'landing';

  return {
    title:
      prefecture && isValidStage
        ? prefecture.name + 'の' + STAGE_LABELS[stage] + ' | stats47地域分析'
        : '人口×駅アクセスの途中地図 | stats47地域分析',
    description:
      '1km将来人口、駅800m圏との重なり、集計検算から最終結果までを都道府県別に確認します。',
    alternates: {
      canonical: isPublishedXLanding ? path : '/geo/population-station-access',
    },
    robots: { index: isPublishedXLanding, follow: true },
  };
}

export default async function GeoStationAccessEvidencePage({
  params,
}: PageProps) {
  const { prefCode, stage } = await params;
  if (
    !PREFECTURE_LIST_2DIGIT.some(
      (prefecture) => prefecture.code === prefCode
    ) ||
    !isGeoStationAccessView(stage)
  ) {
    notFound();
  }

  return (
    <GeoCrossAnalysisArticle
      slug="population-station-access"
      initialPrefCode={prefCode}
      initialStage={stage}
      contextLayer={
        <ThemeStationPassengersSection initialPrefCode={prefCode} />
      }
    />
  );
}
