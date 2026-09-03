import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { fetchPrefectures } from '@stats47/area';
import { Button } from '@stats47/components/atoms/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { getMetricConfig } from '@stats47/data-configs';
import { KNOWN_MUNICIPALITY_RANKING_KEYS } from '@stats47/data-configs/geo-scope';
import {
  readMunicipalityRankingItem,
  readMunicipalityRankingValues,
} from '@stats47/ranking/server';
import { formatValueWithPrecision } from '@stats47/utils';
import { ChevronDown } from 'lucide-react';


import { DistributionHistogram } from '@/components/charts/DistributionHistogram';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';
import { SectionHeader } from '@/components/section';

import { NativeAffiliateRow } from '@/features/ads';
import { CATEGORY_AFFILIATE_MAP } from '@/features/ads/constants/affiliate-category';
import { resolveAffiliateBannersByVertical } from '@/features/ads/server';
import {
  MunicipalityRankingViewTracker,
  binMunicipalityValues,
  filterMunicipalityRanking,
  municipalityLeafName,
} from '@/features/municipalities';
import { MunicipalityRankingMapSection } from '@/features/municipalities/server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';
import { UrlPolicy } from '@/lib/url-policy';

import type { Metadata } from 'next';

interface Params {
  rankingKey: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamic = 'force-dynamic';

// subtitle は generator が「published 集合内で title が衝突するときだけ」焼き込む。
// 在るときは title と併記しないと同一 <title> のページが複数できる (事業所数×業種 等)。
function municipalityRankingDisplayTitle(item: {
  title: string;
  subtitle?: string;
}): string {
  return item.subtitle ? `${item.title}（${item.subtitle}）` : item.title;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function pageHref(
  rankingKey: string,
  query: string,
  prefectureCode: string,
  page: number
): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (prefectureCode) params.set('pref', prefectureCode);
  if (page > 1) params.set('page', String(page));
  const suffix = params.toString();
  return `/municipalities/ranking/${rankingKey}${suffix ? `?${suffix}` : ''}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { rankingKey } = await params;
  if (!KNOWN_MUNICIPALITY_RANKING_KEYS.has(rankingKey)) return {};
  const item = await readMunicipalityRankingItem(rankingKey);
  if (!item) return {};
  const displayTitle = municipalityRankingDisplayTitle(item);
  const title = `${displayTitle} 市区町村ランキング【${item.latestYear.yearName}】`;
  const description = `${displayTitle}を${item.valueCount.toLocaleString('ja-JP')}市区町村で比較。自治体名検索と都道府県絞り込みに対応しています。`;
  return {
    title,
    description,
    alternates: { canonical: `/municipalities/ranking/${item.rankingKey}` },
    ...generateOGMetadata({ title, description, imageUrl: '/og-image.jpg' }),
  };
}

export default async function MunicipalityRankingPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ rankingKey }, queryParams] = await Promise.all([
    params,
    searchParams,
  ]);
  if (!KNOWN_MUNICIPALITY_RANKING_KEYS.has(rankingKey)) notFound();
  // 広告の意図軸は metric config (git TS SSOT) の category → vertical。都道府県ランキングと同じ写像
  const affiliateVertical = (() => {
    const category = getMetricConfig(rankingKey)?.category;
    return category ? CATEGORY_AFFILIATE_MAP[category] : undefined;
  })();
  const [item, snapshot, nativeBanners] = await Promise.all([
    readMunicipalityRankingItem(rankingKey),
    readMunicipalityRankingValues(rankingKey),
    affiliateVertical
      ? resolveAffiliateBannersByVertical(affiliateVertical, 8).catch(() => [])
      : Promise.resolve([]),
  ]);
  if (!item || !snapshot) {
    return (
      <PageShell>
        <Breadcrumbs
          items={[
            { label: 'ホーム', href: '/' },
            { label: '市区町村', href: '/municipalities' },
            { label: 'ランキング' },
          ]}
        />
        <div
          role="status"
          className="border border-border bg-muted/20 p-5 text-sm text-muted-foreground"
        >
          配信用データを準備しています。しばらくしてから再度ご確認ください。
        </div>
      </PageShell>
    );
  }

  const query = first(queryParams.q).trim();
  const prefectureCode = first(queryParams.pref);
  const requestedPage = Number.parseInt(first(queryParams.page) || '1', 10);
  const filtered = filterMunicipalityRanking(snapshot.values, {
    query,
    prefectureCode,
    page: requestedPage,
    pageSize: 50,
  });
  const distribution = binMunicipalityValues(snapshot.values, {
    prefectureCode: prefectureCode || undefined,
  });
  const median = distribution?.median;
  const minimum = distribution?.min;
  const maximum = distribution?.max;
  const prefName = prefectureCode
    ? fetchPrefectures().find((p) => p.prefCode === prefectureCode)?.prefName
    : undefined;
  // 小数桁はデータセット全体から 1 度だけ解決した precision で揃える
  // (max 単独指定だと 44.0 が 44 になり同じ表内で桁が混ざる。blog-svg-chart-standards §数値の桁揃え)
  const precision = distribution?.precision ?? 0;
  const formatValue = (value: number) =>
    formatValueWithPrecision(value, precision);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${municipalityRankingDisplayTitle(item)} 市区町村ランキング`,
    temporalCoverage: snapshot.yearCode,
    spatialCoverage: '日本の市区町村',
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
    },
    creator: {
      '@type': 'Organization',
      name: item.source.name,
      url: item.source.url,
    },
  };

  return (
    <PageShell>
      <MunicipalityRankingViewTracker
        rankingKey={item.rankingKey}
        title={item.title}
        yearCode={snapshot.yearCode}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '市区町村', href: '/municipalities' },
          { label: municipalityRankingDisplayTitle(item) },
        ]}
      />
      <StatisticsScopeNav current="municipalities" />
      <PageHeader
        eyebrow="市区町村ランキング"
        title={municipalityRankingDisplayTitle(item)}
        description={item.description}
        stats={`${snapshot.yearName}・${snapshot.count.toLocaleString('ja-JP')}自治体`}
      />

      <section
        aria-label="分布の要点"
        className="grid grid-cols-3 border border-border"
      >
        {[
          ['最小', minimum],
          ['中央値', median],
          ['最大', maximum],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="border-r border-border p-3 last:border-r-0"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {typeof value === 'number' ? formatValue(value) : '—'}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                {snapshot.unit}
              </span>
            </p>
          </div>
        ))}
      </section>

      {distribution && (
        <section aria-label="全国分布" className="mt-5">
          <SectionHeader
            title="全国分布"
            action={prefName ? `縦線 = ${prefName}の各自治体` : undefined}
            hideRule
            className="mb-0"
          />
          <div className="mt-2 border border-border p-2">
            <DistributionHistogram
              bins={distribution.bins}
              median={distribution.median}
              precision={distribution.precision}
              unit={snapshot.unit}
              prefLabel={prefName}
              prefValues={distribution.prefValues}
              ariaLabel={`${municipalityRankingDisplayTitle(item)}の全国分布ヒストグラム`}
            />
          </div>
          {!prefectureCode && (
            <p className="mt-1 text-xs text-muted-foreground">
              都道府県で絞り込むと、県内の分布地図を表示します。
            </p>
          )}
        </section>
      )}

      {prefectureCode && (
        <Suspense
          fallback={
            <div className="mt-5 h-72 animate-pulse bg-muted/40" aria-hidden />
          }
        >
          <MunicipalityRankingMapSection
            rankingKey={item.rankingKey}
            unit={snapshot.unit}
            prefectureCode={prefectureCode}
            values={snapshot.values}
          />
        </Suspense>
      )}

      <form
        method="get"
        className="mt-5 grid gap-3 border-y border-border py-4 sm:grid-cols-[1fr_14rem_auto]"
      >
        <label
          htmlFor="municipality-query"
          className="text-xs font-medium text-muted-foreground"
        >
          自治体名
          <input
            id="municipality-query"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="例：神戸市"
            className="mt-1 h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          />
        </label>
        <label
          htmlFor="municipality-prefecture"
          className="text-xs font-medium text-muted-foreground"
        >
          都道府県
          <span className="relative block">
            <select
              id="municipality-prefecture"
              name="pref"
              defaultValue={prefectureCode}
              className="mt-1 h-10 w-full appearance-none border border-input bg-background px-3 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <option value="">すべて</option>
              {fetchPrefectures().map((prefecture) => (
                <option key={prefecture.prefCode} value={prefecture.prefCode}>
                  {prefecture.prefName}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </span>
        </label>
        <Button type="submit" className="h-10 self-end px-5">
          絞り込む
        </Button>
      </form>

      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {filtered.total.toLocaleString('ja-JP')}件
          {filtered.pageCount > 1
            ? `・${filtered.page}/${filtered.pageCount}ページ`
            : ''}
        </p>
        {(query || prefectureCode) && (
          <Link
            href={`/municipalities/ranking/${item.rankingKey}`}
            className="text-xs text-primary hover:underline"
          >
            条件を解除
          </Link>
        )}
      </div>

      <div className="mt-2 overflow-x-auto border border-border">
        <Table>
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow>
              <TableHead className="w-20">順位</TableHead>
              <TableHead>市区町村</TableHead>
              <TableHead className="text-right">値</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.rows.map((row) => {
              const profileHref = `/areas/${row.prefectureCode}/cities/${row.areaCode}`;
              const hasProfile = UrlPolicy.city.isIndexable(
                row.prefectureCode,
                row.areaCode
              );
              return (
                <TableRow key={row.areaCode}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {row.rank}位
                  </TableCell>
                  <TableCell className="font-medium">
                    {hasProfile ? (
                      <Link
                        href={profileHref}
                        className="text-primary hover:underline"
                      >
                        {municipalityLeafName(row.areaName)}
                      </Link>
                    ) : (
                      municipalityLeafName(row.areaName)
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatValue(row.value)} {snapshot.unit}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            該当する自治体はありません。
          </p>
        )}
      </div>

      {filtered.pageCount > 1 && (
        <nav
          aria-label="ランキングのページ"
          className="mt-4 flex items-center justify-between text-sm"
        >
          {filtered.page > 1 ? (
            <Link
              href={pageHref(
                item.rankingKey,
                query,
                prefectureCode,
                filtered.page - 1
              )}
              className="text-primary hover:underline"
            >
              ← 前へ
            </Link>
          ) : (
            <span />
          )}
          {filtered.page < filtered.pageCount && (
            <Link
              href={pageHref(
                item.rankingKey,
                query,
                prefectureCode,
                filtered.page + 1
              )}
              className="text-primary hover:underline"
            >
              次へ →
            </Link>
          )}
        </nav>
      )}

      {/* ネイティブアフィリエイト枠 (categoryKey → vertical。写像が無ければ描画しない) */}
      {nativeBanners.length > 0 && (
        <div className="mt-8">
          <NativeAffiliateRow
            banners={nativeBanners}
            position="municipality-native"
            trackingCategory={`municipality-${item.rankingKey}`}
            variant="three-up"
          />
        </div>
      )}

      <footer className="mt-8 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          出典：
          <a href={item.source.url} className="text-primary hover:underline">
            {item.source.name}
          </a>
        </p>
        <p className="mt-1">
          比較対象は市・町・村です。政令指定都市の行政区と「特別区部」の集約行を除外し、欠測値や比率を定義できない値は順位へ入れていません。
        </p>
      </footer>
    </PageShell>
  );
}
