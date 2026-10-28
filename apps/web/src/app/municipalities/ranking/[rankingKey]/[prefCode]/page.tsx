import { Suspense } from 'react';

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
import { hrefFor } from '@stats47/data-configs/content/href';
import {
  MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING,
  isMunicipalityPrefectureRankingKey,
  scopeHrefsForMunicipalityRanking,
} from '@stats47/data-configs/geo-scope';
import { formatUnitForDisplay } from '@stats47/data-configs/unit';
import {
  buildMunicipalityListNames,
  buildMunicipalityPrefectureRanking,
  buildMunicipalityPrefectureRankingMeta,
  buildMunicipalityPrefectureRankingSummary,
  lacksSpecialWards,
  municipalityPrefectureAreaLabel,
  municipalityRankingDisplayTitle,
} from '@stats47/ranking';
import { formatValueWithPrecision } from '@stats47/utils';

import Link from '@/components/atoms/SiteLink';
import { DistributionHistogram } from '@/components/charts/DistributionHistogram';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { DataSourceList } from '@/components/molecules/DataSourceList';
import { StatisticsScopeNav } from '@/components/navigation';
import { SectionHeader } from '@/components/section';

import {
  MunicipalityPrefectureLinks,
  MunicipalityRankingViewTracker,
  binMunicipalityValues,
} from '@/features/municipalities';
import {
  MunicipalityRankingMapSection,
  getSpecialWardCodes,
  readMunicipalityRanking,
} from '@/features/municipalities/server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { KNOWN_RANKING_KEYS } from '@/config/known-ranking-keys';
import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import type { Metadata } from 'next';

interface Params {
  rankingKey: string;
  prefCode: string;
}

/**
 * 「県名×市区町村ランキング」(MUNI-PREF-RANKING-ROUTE-01)。
 *
 * 全国版の `?pref=` 絞り込みは canonical が全国版を向くので検索に出ない。県名を含む検索に届くよう、
 * 対象の指標 (MUNICIPALITY_PREFECTURE_RANKING_KEYS) だけ県ごとの独立ページにして canonical を自分に向ける。
 * 本文は配信値からテンプレートで組む (LLM で書かない)。全国版と同じく R2 を読むので force-dynamic。
 */
export const dynamic = 'force-dynamic';

function findPrefecture(prefCode: string) {
  return fetchPrefectures().find((prefecture) => prefecture.prefCode === prefCode);
}

async function loadPrefectureRanking({ rankingKey, prefCode }: Params) {
  if (!isMunicipalityPrefectureRankingKey(rankingKey)) return null;
  const prefecture = findPrefecture(prefCode);
  if (!prefecture) return null;
  const { item, values } = await readMunicipalityRanking(rankingKey);
  if (!item || !values) return null;
  const ranking = buildMunicipalityPrefectureRanking(values.values, prefCode, getSpecialWardCodes());
  // 比べる相手が少なすぎる県はページを作らない (薄いページにしない)
  if (!ranking || ranking.rows.length < MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING) return null;
  return { item, values, ranking, prefecture };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const loaded = await loadPrefectureRanking(await params);
  if (!loaded) return {};
  const { item, values, ranking, prefecture } = loaded;
  const { title, description } = buildMunicipalityPrefectureRankingMeta(
    item,
    values,
    ranking,
    prefecture.prefName
  );
  return {
    title,
    description,
    alternates: {
      canonical: hrefFor('municipality-pref-ranking', {
        rankingKey: item.rankingKey,
        prefCode: prefecture.prefCode,
      }),
    },
    ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
  };
}

export default async function MunicipalityPrefectureRankingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const loaded = await loadPrefectureRanking(await params);
  if (!loaded) notFound();
  const { item, values: snapshot, ranking, prefecture } = loaded;

  const displayTitle = municipalityRankingDisplayTitle(item);
  const areaLabel = municipalityPrefectureAreaLabel(ranking.hasSpecialWards);
  // 東京都で特別区に値が無い指標 (財政力指数など) は、区が無い理由を書く (MUNI-WARD-GAP-DISPLAY-01)
  const showWardGapNote = prefecture.prefCode === '13000' && lacksSpecialWards(snapshot.values, getSpecialWardCodes());
  const summary = buildMunicipalityPrefectureRankingSummary(ranking, {
    prefectureName: prefecture.prefName,
    unit: snapshot.unit,
    metricLabel: displayTitle,
  });
  const distribution = binMunicipalityValues(snapshot.values, {
    prefectureCode: prefecture.prefCode,
  });
  // 小数桁は全国のデータセットから 1 度だけ解決する (全国版と同じ桁で並べる)
  const precision = distribution?.precision ?? 0;
  const formatValue = (value: number) => formatValueWithPrecision(value, precision);
  const unit = formatUnitForDisplay(snapshot.unit);
  const listName = buildMunicipalityListNames(ranking.rows.map((row) => row.areaName));
  const nationalHref = hrefFor('municipality-ranking', { rankingKey: item.rankingKey });

  return (
    <PageShell>
      <MunicipalityRankingViewTracker
        rankingKey={item.rankingKey}
        title={item.title}
        yearCode={snapshot.yearCode}
      />
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '市区町村', href: '/municipalities' },
          { label: displayTitle, href: nationalHref },
          { label: prefecture.prefName },
        ]}
      />
      <StatisticsScopeNav
        current="municipalities"
        hrefs={{
          ...scopeHrefsForMunicipalityRanking(item.rankingKey, (key) => KNOWN_RANKING_KEYS.has(key)),
          municipalities: nationalHref,
        }}
      />
      <PageHeader
        eyebrow="市区町村ランキング"
        title={`${prefecture.prefName}の${areaLabel}${displayTitle}ランキング`}
        description={item.description}
        stats={`${snapshot.yearName}・${ranking.rows.length.toLocaleString('ja-JP')}${areaLabel}`}
      />

      <section aria-label="要点" className="border border-border p-4 text-sm leading-relaxed">
        {summary.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
        <p className="mt-2">
          <Link href={nationalHref} className="text-primary hover:underline">
            全国{snapshot.count.toLocaleString('ja-JP')}市区町村のランキングを見る →
          </Link>
        </p>
      </section>

      <Suspense fallback={<div className="mt-5 h-72 animate-pulse bg-muted/40" aria-hidden />}>
        <MunicipalityRankingMapSection
          visualization={item.visualization}
          unit={snapshot.unit}
          prefectureCode={prefecture.prefCode}
          values={snapshot.values}
        />
      </Suspense>

      <section aria-label={`${prefecture.prefName}の順位`} className="mt-5">
        <SectionHeader title={`${prefecture.prefName}の順位`} hideRule className="mb-2" />
        <div className="overflow-x-auto border border-border">
          <Table>
            <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
              <TableRow>
                <TableHead className="w-20">県内順位</TableHead>
                <TableHead>{areaLabel}</TableHead>
                <TableHead className="text-right!">値</TableHead>
                <TableHead className="w-24 text-right!">全国順位</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.rows.map((row) => (
                <TableRow key={row.areaCode}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {row.prefectureRank}位
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={hrefFor('city', { areaCode: row.prefectureCode, cityCode: row.areaCode })}
                      className="text-primary hover:underline"
                    >
                      {listName(row.areaName)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatValue(row.value)} {unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.rank}位
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {distribution && (
        <section aria-label="全国分布" className="mt-5">
          <SectionHeader
            title="全国分布"
            action={`縦線 = ${prefecture.prefName}の各${areaLabel}`}
            hideRule
            className="mb-0"
          />
          <div className="mt-2 border border-border p-2">
            <DistributionHistogram
              bins={distribution.bins}
              median={distribution.median}
              precision={distribution.precision}
              unit={snapshot.unit}
              prefLabel={prefecture.prefName}
              prefValues={distribution.prefValues}
              ariaLabel={`${displayTitle}の全国分布ヒストグラム`}
            />
          </div>
        </section>
      )}

      <MunicipalityPrefectureLinks
        rankingKey={item.rankingKey}
        title={`ほかの都道府県の${displayTitle}ランキング`}
        currentPrefectureCode={prefecture.prefCode}
      />

      <DataSourceList
        sources={[{ label: item.source.name, url: item.source.url, tables: [] }]}
        surface="municipality_source"
      />
      <footer className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {showWardGapNote && <p>東京23区（特別区）は、元の統計に区ごとの値が無いため、このランキングに含まれていません。</p>}
        <p>
          県内順位は全国順位の順に数え直したもので、全国で同じ順位の自治体は県内でも同じ順位です。政令指定都市は市全体の値で、行政区は含みません。欠測値は順位に入れていません。
        </p>
      </footer>
    </PageShell>
  );
}
