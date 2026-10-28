import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { fetchPrefectures } from '@stats47/area';
import { cn } from '@stats47/components';
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
import { hrefFor } from "@stats47/data-configs/content/href";
import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  isMunicipalityPrefectureRankingKey,
  scopeHrefsForMunicipalityRanking,
} from '@stats47/data-configs/geo-scope';
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import {
  buildMunicipalityListNames,
  buildMunicipalityRankingMeta,
  isMunicipalityAiContentCurrent,
  municipalityAbsenceNote,
  municipalityRankingDisplayTitle,
} from '@stats47/ranking';
import { formatValueWithPrecision } from '@stats47/utils';
import { ChevronDown } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { DistributionHistogram } from '@/components/charts/DistributionHistogram';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { DataSourceList } from '@/components/molecules/DataSourceList';
import { StatisticsScopeNav } from '@/components/navigation';
import { SectionHeader } from '@/components/section';
import { STAT_VALUE_CLASS } from '@/components/surface';

import { NativeAffiliateRow } from '@/features/ads';
import { CATEGORY_AFFILIATE_MAP } from '@/features/ads/constants/affiliate-category';
import { resolveAffiliateBannersByVertical } from '@/features/ads/server';
import { RelatedContentNavigation } from '@/features/content-navigation/RelatedContentNavigation';
import {
  MunicipalityPrefectureLinks,
  MunicipalityRankingCommentary,
  MunicipalityRankingViewTracker,
  binMunicipalityValues,
  buildMunicipalityDatasetStructuredData,
  filterMunicipalityRanking,
} from '@/features/municipalities';
import {
  MunicipalityRankingMapSection,
  getComparableMunicipalityCodes,
  getSpecialWardCodes,
  readMunicipalityRanking,
  readMunicipalityRankingCommentary,
} from '@/features/municipalities/server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { KNOWN_RANKING_KEYS } from '@/config/known-ranking-keys';
import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

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
  const { item, values } = await readMunicipalityRanking(rankingKey);
  if (!item || !values) return {};
  const { title, description } = buildMunicipalityRankingMeta(item, values);
  return {
    title,
    description,
    alternates: { canonical: hrefFor("municipality-ranking", { rankingKey: item.rankingKey }) },
    ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
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
  const [{ item, values: snapshot }, nativeBanners, aiContent] = await Promise.all([
    readMunicipalityRanking(rankingKey),
    affiliateVertical
      ? resolveAffiliateBannersByVertical(affiliateVertical, 8).catch(() => [])
      : Promise.resolve([]),
    readMunicipalityRankingCommentary(rankingKey),
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

  // 解説は今の values.json に対して監査済みのときだけ出す (値が改訂された回は前回の解説を出さない)
  const commentary =
    aiContent && isMunicipalityAiContentCurrent(aiContent, snapshot) ? aiContent : null;
  // ランキングに居ない自治体の理由 (将来負担比率の「―」は該当なし、財政力指数の 23 区は元の統計に値が無い)
  const absenceNote = municipalityAbsenceNote(snapshot.values, {
    comparableCodes: getComparableMunicipalityCodes(),
    specialWardCodes: getSpecialWardCodes(),
    absentValueReason: getMetricConfig(rankingKey)?.absentValueReason,
  });
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
  // 同じ名前の自治体 (府中市・伊達市など) だけ県名を添える
  const listName = buildMunicipalityListNames(snapshot.values.map((row) => row.areaName));
  const structuredData = buildMunicipalityDatasetStructuredData({
    item,
    snapshot,
  });

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
      <StatisticsScopeNav
        current="municipalities"
        hrefs={scopeHrefsForMunicipalityRanking(item.rankingKey, (key) => KNOWN_RANKING_KEYS.has(key))}
      />
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
            <p className={cn(STAT_VALUE_CLASS, "mt-1")}>
              {typeof value === 'number' ? formatValue(value) : '—'}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                {formatUnitForDisplay(snapshot.unit)}
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
            visualization={item.visualization}
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
            className="mt-1 h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
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
              className="mt-1 h-10 w-full appearance-none border border-input bg-background px-3 pr-9 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
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
        <Button type="submit" className="self-end">
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
            href={hrefFor("municipality-ranking", { rankingKey: item.rankingKey })}
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
              <TableHead className="text-right!">値</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.rows.map((row) => (
              <TableRow key={row.areaCode}>
                <TableCell className="tabular-nums text-muted-foreground">
                  {row.rank}位
                </TableCell>
                <TableCell className="font-medium">
                  {/* 配信値の市区町村は市区町村ページの公開対象と同じ集合なので、全行をリンクにする */}
                  <Link
                    href={hrefFor('city', { areaCode: row.prefectureCode, cityCode: row.areaCode })}
                    className="text-primary hover:underline"
                  >
                    {listName(row.areaName)}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatValue(row.value)} {formatUnitForDisplay(snapshot.unit)}
                </TableCell>
              </TableRow>
            ))}
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

      {isMunicipalityPrefectureRankingKey(item.rankingKey) && (
        <MunicipalityPrefectureLinks
          rankingKey={item.rankingKey}
          title={`都道府県別の${municipalityRankingDisplayTitle(item)}ランキング`}
        />
      )}

      {commentary && <MunicipalityRankingCommentary content={commentary} />}

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

      <div className="mt-8">
        <RelatedContentNavigation
          title="同じ指標のランキング・記事・テーマ"
          sourceId={`municipality-ranking:${item.rankingKey}`}
          kinds={['ranking', 'blog', 'municipality-theme']}
          limit={4}
          surface="municipality_related"
        />
      </div>

      {/* 市区町村 snapshot に焼き込まれた出典 (都道府県 metric の統計表とは別の表を使う指標がある) */}
      <DataSourceList
        sources={[{ label: item.source.name, url: item.source.url, tables: [] }]}
        surface="municipality_source"
      />
      <footer className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {absenceNote && <p>{absenceNote}</p>}
        <p>
          比較対象は市・町・村と東京23区です。政令指定都市の行政区と「特別区部」の集約行は除外し、欠測値や比率を定義できない値は順位へ入れていません。
        </p>
      </footer>
    </PageShell>
  );
}
