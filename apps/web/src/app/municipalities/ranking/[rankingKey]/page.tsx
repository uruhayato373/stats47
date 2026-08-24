import Link from 'next/link';
import { notFound } from 'next/navigation';

import { fetchPrefectures } from '@stats47/area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { KNOWN_MUNICIPALITY_RANKING_KEYS } from '@stats47/data-configs/geo-scope';
import {
  readMunicipalityRankingItem,
  readMunicipalityRankingValues,
} from '@stats47/ranking/server';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { RightRailWidgets } from '@/components/rail';

import {
  MunicipalityRankingViewTracker,
  StatisticsScopeNav,
  filterMunicipalityRanking,
  municipalityLeafName,
} from '@/features/municipalities';

import { generateOGMetadata } from '@/lib/metadata/og-generator';
import { UrlPolicy } from '@/lib/url-policy';

import type { Metadata } from 'next';

interface Params {
  rankingKey: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamic = 'force-dynamic';

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
  const title = `${item.title} 市区町村ランキング【${item.latestYear.yearName}】`;
  const description = `${item.title}を${item.valueCount.toLocaleString('ja-JP')}市区町村で比較。自治体名検索と都道府県絞り込みに対応しています。`;
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
  const [{ rankingKey }, queryParams] = await Promise.all([params, searchParams]);
  if (!KNOWN_MUNICIPALITY_RANKING_KEYS.has(rankingKey)) notFound();
  const [item, snapshot] = await Promise.all([
    readMunicipalityRankingItem(rankingKey),
    readMunicipalityRankingValues(rankingKey),
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
  const sortedValues = [...snapshot.values].sort((a, b) => a.value - b.value);
  const median = sortedValues[Math.floor((sortedValues.length - 1) / 2)]?.value;
  const minimum = sortedValues[0]?.value;
  const maximum = sortedValues.at(-1)?.value;
  const numberFormat = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
  });
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${item.title} 市区町村ランキング`,
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
    <PageShell rightRail={<RightRailWidgets />}>
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
          { label: item.title },
        ]}
      />
      <StatisticsScopeNav current="municipalities" />
      <PageHeader
        eyebrow="市区町村ランキング"
        title={item.title}
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
              {typeof value === 'number' ? numberFormat.format(value) : '—'}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                {snapshot.unit}
              </span>
            </p>
          </div>
        ))}
      </section>

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
            className="mt-1 h-10 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label
          htmlFor="municipality-prefecture"
          className="text-xs font-medium text-muted-foreground"
        >
          都道府県
          <select
            id="municipality-prefecture"
            name="pref"
            defaultValue={prefectureCode}
            className="mt-1 h-10 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">すべて</option>
            {fetchPrefectures().map((prefecture) => (
              <option key={prefecture.prefCode} value={prefecture.prefCode}>
                {prefecture.prefName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 self-end bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          絞り込む
        </button>
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
                    {numberFormat.format(row.value)} {snapshot.unit}
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

      <footer className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
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
