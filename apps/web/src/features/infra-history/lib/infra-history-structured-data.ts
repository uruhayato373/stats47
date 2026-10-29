import {
  infraNetworkPageUrl,
  infraNetworkTerms,
  type InfraHistorySummary,
  type InfraLengthSeries,
  type InfraNetworkDefinition,
} from '@stats47/gis/infra-history';

import { SITE_NAME, SITE_ORIGIN } from '@/config/site';

import { infraHistoryPath, infraNetworkNoun, type ResolvedInfraScope } from './infra-history-scope';

/** 範囲 (全国・地方・県) の年別の系列 */
export function seriesForScope(
  summary: InfraHistorySummary,
  scope: ResolvedInfraScope,
): InfraLengthSeries | null {
  if (scope.kind === 'national') return summary.national;
  if (scope.kind === 'region') return summary.regions[scope.slug ?? ''] ?? null;
  return summary.prefectures[scope.slug ?? ''] ?? null;
}

function sourceYear(network: InfraNetworkDefinition): string {
  return network.source.version.length === 2 ? `20${network.source.version}` : network.source.version;
}

function formatMeasure(network: InfraNetworkDefinition, value: number): string {
  return `${Math.round(value).toLocaleString('ja-JP')} ${network.measure.unit}`;
}

/** 範囲の題名の頭 (全国は付けない) */
function scopePrefix(scope: ResolvedInfraScope): string {
  return scope.kind === 'national' ? '' : `${scope.name}の`;
}

/**
 * meta description。最新年の値と最初の年からの増分を入れ、検索結果だけで規模が分かるようにする。
 * 系列が読めないときは値を書かない (推測した数字を出さない)。
 */
export function buildInfraHistoryDescription(
  network: InfraNetworkDefinition,
  scope: ResolvedInfraScope,
  series: InfraLengthSeries | null,
): string {
  const { first, last } = network.years;
  const noun = infraNetworkNoun(network);
  const latest = series?.total[series.total.length - 1];
  const figure =
    latest === undefined ? '' : `${last}年の${network.measure.label}は${formatMeasure(network, latest)}。`;
  return (
    `${scopePrefix(scope)}${noun}が${first}年から${last}年までにどこで増え、どこで消えたかを年ごとの地図で示します。${figure}` +
    `${scope.kind === 'prefecture' ? '' : '都道府県別の'}${network.measure.label}と種別の内訳も比べられます。`
  );
}

/**
 * schema.org Dataset。Google の Dataset 構造化データ (description 50〜5,000 字) に従い、
 * 画面に出している内容 (題名・期間・範囲・最新の値・出典の 1 行) だけを書く。
 * ダウンロードは提供しないので distribution は付けない。
 */
export function buildInfraHistoryStructuredData({
  network,
  scope,
  series,
  generatedAt,
  siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? SITE_ORIGIN,
}: {
  network: InfraNetworkDefinition;
  scope: ResolvedInfraScope;
  series: InfraLengthSeries | null;
  generatedAt: string | null;
  siteUrl?: string;
}) {
  const origin = siteUrl.replace(/\/$/, '');
  const canonicalUrl = `${origin}${infraHistoryPath(network.key, scope.slug)}`;
  const { first, last } = network.years;
  const noun = infraNetworkNoun(network);
  const terms = infraNetworkTerms(network);
  const description =
    `${buildInfraHistoryDescription(network, scope, series)}` +
    `国土交通省「${network.source.name}」（${sourceYear(network)}年版）をもとに、stats47 が年別の${network.measure.label}を都道府県ごとに集計しました。`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${scopePrefix(scope)}${noun}の変遷（${first}〜${last}年）`,
    description: description.slice(0, 5000),
    url: canonicalUrl,
    identifier: canonicalUrl,
    keywords: [network.label, noun, '時系列', '都道府県', scope.name, '国土数値情報'],
    ...(generatedAt ? { dateModified: generatedAt } : {}),
    temporalCoverage: `${first}/${last}`,
    spatialCoverage: {
      '@type': 'Place',
      name: scope.kind === 'national' ? '日本' : scope.name,
    },
    variableMeasured: {
      '@type': 'PropertyValue',
      name: network.measure.label,
      unitText: network.measure.unit,
    },
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: origin,
    },
    isBasedOn: {
      '@type': 'Dataset',
      name: network.source.name,
      // 入れ子の Dataset にも 50 字以上の description が要る (invalidDatasetDescriptions)
      description:
        `${network.source.provider}が公開する${network.source.name}（${sourceYear(network)}年版）。` +
        `全国の${network.label}の${network.geometry === 'line' ? '区間' : '施設'}を、供用の始まりと終わりの年とともに記録した時系列の GIS データです。`,
      url: infraNetworkPageUrl(network),
      version: sourceYear(network),
      creator: { '@type': 'Organization', name: network.source.provider },
    },
    // 国土数値情報は版ごとのライセンス URL を持たないので、利用条件を記載した公式ページを指す
    license: {
      '@type': 'CreativeWork',
      name: `国土数値情報の利用条件（${terms.evidence}）`,
      url: infraNetworkPageUrl(network),
    },
    isAccessibleForFree: true,
  } as const;
}
