/**
 * 地域プロファイルページの構造化データ（JSON-LD）ユーティリティ
 *
 * SEO対策のための構造化データを生成
 */

import { getRequiredBaseUrl } from '@/lib/env';

import type { AreaHighlights } from '@stats47/area-profile';

interface AreaIdentity {
  areaCode: string;
  areaName: string;
}

/**
 * 地域プロファイルページのパンくずリスト構造化データ（BreadcrumbList）を生成
 *
 * Google 検索結果にパンくずナビゲーションを表示するための JSON-LD を返す。
 * 構造: ホーム > 都道府県一覧 > {都道府県名}の地域プロファイル
 */
export function generateAreaProfileBreadcrumbStructuredData({
  profile,
}: {
  profile: AreaIdentity;
}): object {
  const baseUrl = getRequiredBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '都道府県一覧',
        item: `${baseUrl}/areas`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${profile.areaName}の特徴`,
      },
    ],
  };
}

/**
 * 地域プロファイルページの AdministrativeArea 構造化データを生成
 *
 * 都道府県を AdministrativeArea として記述し、県の「特徴」(selectAreaHighlights の結果) を
 * PropertyValue として含める。件数は選定時に決まっている。
 */
export function generateAreaProfileStructuredData({
  profile,
  highlights,
}: {
  profile: AreaIdentity;
  highlights: AreaHighlights;
}): object {
  const baseUrl = getRequiredBaseUrl();

  const additionalProperty = [...highlights.top, ...highlights.bottom].map((item) => ({
    '@type': 'PropertyValue' as const,
    name: item.label,
    value: item.value,
    unitText: item.unit,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'AdministrativeArea',
    name: profile.areaName,
    url: `${baseUrl}/areas/${profile.areaCode}`,
    containedInPlace: {
      '@type': 'Country',
      name: '日本',
    },
    ...(additionalProperty.length > 0 && { additionalProperty }),
  };
}
