import { notFound } from 'next/navigation';

import {
  GeoCrossAnalysisArticle,
  GEO_CROSS_ANALYSIS_CONFIGS,
  isGeoCrossAnalysisSlug,
} from '@/features/geo-analysis';

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ analysisSlug: string }>;
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
    robots: { index: false, follow: true },
  };
}

export default async function GeoCrossAnalysisPage({ params }: PageProps) {
  const { analysisSlug } = await params;
  if (!isGeoCrossAnalysisSlug(analysisSlug)) notFound();
  return <GeoCrossAnalysisArticle slug={analysisSlug} />;
}
