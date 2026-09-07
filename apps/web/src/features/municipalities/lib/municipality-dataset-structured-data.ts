const DEFAULT_SITE_URL = 'https://stats47.jp';
const DEFAULT_R2_PUBLIC_URL = 'https://storage.stats47.jp';
const GOVERNMENT_STANDARD_TERMS_URL =
  'https://www.digital.go.jp/resources/open_data';

interface MunicipalityDatasetItem {
  rankingKey: string;
  title: string;
  subtitle?: string;
  description: string;
  valueCount: number;
  source: { name: string; url: string };
}

interface MunicipalityDatasetSnapshot {
  generatedAt: string;
  yearCode: string;
  yearName: string;
  unit: string;
  count: number;
}

function displayTitle(item: MunicipalityDatasetItem): string {
  return item.subtitle ? `${item.title}（${item.subtitle}）` : item.title;
}

export function buildMunicipalityDatasetStructuredData({
  item,
  snapshot,
  siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_SITE_URL,
  r2PublicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? DEFAULT_R2_PUBLIC_URL,
}: {
  item: MunicipalityDatasetItem;
  snapshot: MunicipalityDatasetSnapshot;
  siteUrl?: string;
  r2PublicUrl?: string;
}) {
  const title = displayTitle(item);
  const canonicalUrl = `${siteUrl.replace(/\/$/, '')}/municipalities/ranking/${encodeURIComponent(item.rankingKey)}`;
  const contentUrl = `${r2PublicUrl.replace(/\/$/, '')}/app/municipalities/ranking/${encodeURIComponent(item.rankingKey)}/values.json`;
  const description =
    `${title}について、${snapshot.yearName}の値を${item.valueCount.toLocaleString('ja-JP')}市区町村で比較できるランキングデータセットです。` +
    `日本全国の自治体間の違いを確認でき、自治体名検索と都道府県での絞り込みに対応しています。${item.description}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${title} 市区町村ランキング（${snapshot.yearName}）`,
    description: description.slice(0, 5000),
    url: canonicalUrl,
    identifier: canonicalUrl,
    keywords: ['統計', '市区町村', 'ランキング', title, snapshot.yearName],
    dateModified: snapshot.generatedAt,
    temporalCoverage: snapshot.yearCode,
    spatialCoverage: {
      '@type': 'Place',
      name: '日本の市区町村',
    },
    variableMeasured: {
      '@type': 'PropertyValue',
      name: title,
      unitText: snapshot.unit,
    },
    creator: {
      '@type': 'Organization',
      name: item.source.name,
      url: item.source.url,
    },
    publisher: {
      '@type': 'Organization',
      name: '統計で見る都道府県',
      url: siteUrl.replace(/\/$/, ''),
    },
    isBasedOn: {
      '@type': 'Dataset',
      name: item.source.name,
      url: item.source.url,
    },
    license: {
      '@type': 'CreativeWork',
      name: '政府標準利用規約（第2.0版）',
      url: GOVERNMENT_STANDARD_TERMS_URL,
    },
    isAccessibleForFree: true,
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl,
    },
  } as const;
}
