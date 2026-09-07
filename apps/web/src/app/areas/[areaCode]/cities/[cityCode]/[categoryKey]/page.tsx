import { notFound, permanentRedirect } from 'next/navigation';


import { getCityRouteContext } from '@/features/area-profile';

import { UrlPolicy } from '@/lib/url-policy';

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ areaCode: string; cityCode: string; categoryKey: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaCode, cityCode, categoryKey } = await params;
  const context = getCityRouteContext(areaCode, cityCode);
  if (
    !context ||
    !UrlPolicy.city.isIndexable(areaCode, cityCode) ||
    !UrlPolicy.cityCategory.isKnown(categoryKey)
  ) {
    return { title: 'ページが見つかりません', robots: 'noindex, follow' };
  }

  return {
    title: `${context.city.areaName}の統計データ`,
    robots: 'noindex, follow',
    alternates: { canonical: context.cityBasePath },
  };
}

export default async function LegacyCityCategoryPage({ params }: PageProps) {
  const { areaCode, cityCode, categoryKey } = await params;
  const context = getCityRouteContext(areaCode, cityCode);
  if (
    !context ||
    !UrlPolicy.city.isIndexable(areaCode, cityCode) ||
    !UrlPolicy.cityCategory.isKnown(categoryKey)
  ) {
    notFound();
  }

  permanentRedirect(context.cityBasePath);
}
