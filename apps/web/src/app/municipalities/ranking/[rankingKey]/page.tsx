import { notFound } from 'next/navigation';

import { fetchPrefectures } from '@stats47/area';
import { cn } from '@stats47/components';
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

import Link from '@/components/atoms/SiteLink';
import { DistributionHistogram } from '@/components/charts/DistributionHistogram';
import { ArticleShell, Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { DataSourceList } from '@/components/molecules/DataSourceList';
import { StatisticsScopeNav } from '@/components/navigation';
import { RailLinksCard } from '@/components/rail';
import { SectionHeader } from '@/components/section';
import { STAT_VALUE_CLASS, ValueTable } from '@/components/surface';

import { AdRow, composeAdRows, RailAdSlot } from '@/features/ads';
import { RelatedContentNavigation } from '@/features/content-navigation/RelatedContentNavigation';
import {
  MunicipalityNationalMap,
  MunicipalityRankingCommentary,
  MunicipalityRankingExplorer,
  MunicipalityRankingViewTracker,
  binMunicipalityValues,
  buildMunicipalityDatasetStructuredData,
  filterMunicipalityRanking,
} from '@/features/municipalities';
import {
  getComparableMunicipalityCodes,
  getSpecialWardCodes,
  readMunicipalityRanking,
  readMunicipalityRankingCommentary,
} from '@/features/municipalities/server';
import { findDataProductForMunicipalityRanking, TrackedProductLink } from '@/features/products';

import {
  MUNICIPALITY_AFTER_MAP,
  MUNICIPALITY_AFTER_TABLE,
  MUNICIPALITY_RAIL,
  MUNICIPALITY_RAIL_STICKY,
} from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { KNOWN_RANKING_KEYS } from '@/config/known-ranking-keys';
import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import type { Metadata } from 'next';

interface Params {
  rankingKey: string;
}

// 1 指標 1 URL の HTML を 1 日キャッシュする (2026-11-13)。以前は県・ページ・自治体名のクエリで描き分ける
// 毎回描画のページで、クローラーが 47 県とページ送りのリンクを総なめにするたびに 1.5〜2 秒の描画が走っていた。
// 県の違いは県別のパス、ページ送りと自治体名の検索はクライアントの部品が担い、URL に載せない。
// R2 を読む動的 route なので generateStaticParams は付けない (nextjs-ssg-preservation.md)
export const revalidate = 86400;

/** サーバーが HTML に出す上位の件数 (検索エンジンに読ませる一覧)。51 位以下は利用者の操作で読む */
const INITIAL_ROWS = 50;

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
}: {
  params: Promise<Params>;
}) {
  const { rankingKey } = await params;
  if (!KNOWN_MUNICIPALITY_RANKING_KEYS.has(rankingKey)) notFound();
  const [{ item, values: snapshot }, aiContent] = await Promise.all([
    readMunicipalityRanking(rankingKey),
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
  // 全国版は常に全国の上位 (1 ページ目) だけを HTML に出す。絞り込みと 51 位以下は MunicipalityRankingExplorer
  const topRows = filterMunicipalityRanking(snapshot.values, { pageSize: INITIAL_ROWS }).rows;
  const prefectures = fetchPrefectures();
  const distribution = binMunicipalityValues(snapshot.values);
  const median = distribution?.median;
  const minimum = distribution?.min;
  const maximum = distribution?.max;
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

  const dataProduct = findDataProductForMunicipalityRanking(item.rankingKey);
  // 広告の段 (2026-11-12 オーナー決定): 地図の後・順位の表の後に、AdSense 1 つを本文の幅いっぱいで出す (PR は出さない)。
  // ページの最後の段は、同日に右レールを付けて関連の一覧が右レールへ移った結果、表の後の段と出典・注記だけを挟んで
  // 約 240〜280px で続いたので外した (PC は右レールの 2 枠が加わる)
  const [rowAfterMap, rowAfterTable] = composeAdRows(
    [['adsense'], ['adsense']],
    [MUNICIPALITY_AFTER_MAP, MUNICIPALITY_AFTER_TABLE],
    [],
  );
  // 右レール (2026-11-12 オーナー決定): 都道府県のランキングと同じ右レール付きの枠にする。並びは「関連 → AdSense → 都道府県のカード → 追従する 300×600」。
  // 都道府県のカードは全指標で出し、2 つの広告の間に必ず内容が入るようにする (オーナー決定)。行き先は、県別のページがある指標は
  // そのページ (パス)、無い指標はその県のページ (/areas/<県>。県内の市区町村の一覧がある)。
  // 2026-11-13: 以前は県別のページが無い指標でこのページの ?pref= へ結び、クローラーが 47 県分の描画を起こしていた。
  // クエリ付きのリンクは出さない。県での絞り込みは本文の MunicipalityRankingExplorer が URL を変えずに行う。
  // 狭い幅では右レールは本文の下に積まれ、右レールの AdSense は出ない (RailAdSlot は本文の横にあるときだけ)
  const hasPrefectureRankings = isMunicipalityPrefectureRankingKey(item.rankingKey);
  const prefectureLinks = prefectures.map((prefecture) => ({
    id: prefecture.prefCode,
    label: prefecture.prefName,
    href: hasPrefectureRankings
      ? hrefFor('municipality-pref-ranking', {
          rankingKey: item.rankingKey,
          prefCode: prefecture.prefCode,
        })
      : hrefFor('area', { areaCode: prefecture.prefCode }),
  }));
  const rail = (
    <>
      <RelatedContentNavigation
        title="同じ指標のランキング・記事・テーマ"
        sourceId={`municipality-ranking:${item.rankingKey}`}
        kinds={['ranking', 'blog', 'municipality-theme']}
        limit={4}
        surface="municipality_related"
      />
      <RailAdSlot slot={MUNICIPALITY_RAIL} />
      <RailLinksCard
        title={
          hasPrefectureRankings
            ? `都道府県別の${municipalityRankingDisplayTitle(item)}ランキング`
            : '都道府県から市区町村を探す'
        }
        layout="chips"
        items={prefectureLinks}
        trackingSurface="municipality_prefecture"
      />
      <RailAdSlot slot={MUNICIPALITY_RAIL_STICKY} sticky />
    </>
  );
  return (
    <ArticleShell
      rail={rail}
      breadcrumb={
        <Breadcrumbs
          items={[
            { label: 'ホーム', href: '/' },
            { label: '市区町村', href: '/municipalities' },
            { label: municipalityRankingDisplayTitle(item) },
          ]}
        />
      }
      header={
        <>
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
        </>
      }
    >
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
          <SectionHeader title="全国分布" hideRule className="mb-0" />
          <div className="mt-2 border border-border p-2">
            <DistributionHistogram
              bins={distribution.bins}
              median={distribution.median}
              precision={distribution.precision}
              unit={snapshot.unit}
              ariaLabel={`${municipalityRankingDisplayTitle(item)}の全国分布ヒストグラム`}
            />
          </div>
        </section>
      )}

      <MunicipalityNationalMap
        title={item.title}
        visualization={item.visualization}
        unit={snapshot.unit}
        decimalPlaces={precision}
        values={snapshot.values.map((v) => ({ areaCode: v.areaCode, value: v.value }))}
      />

      {rowAfterMap.length > 0 && (
        <div className="mt-8">
          <AdRow cells={rowAfterMap} position="municipality-row-1" trackingCategory={`municipality-${item.rankingKey}`} wide />
        </div>
      )}

      {dataProduct && (
        <p className="mt-5 text-sm text-muted-foreground">
          この指標の長期の時系列と地図に結合できる境界データは、{dataProduct.channelLabel}（
          {formatValueWithPrecision(dataProduct.priceYen, 0)}円）で配布しています。{' '}
          <TrackedProductLink
            href={hrefFor('product', { slug: dataProduct.slug })}
            label={`${dataProduct.id}:${dataProduct.title}`}
            surface="ranking_product"
            product={dataProduct}
            placement="municipality_ranking_product"
            className="text-primary underline underline-offset-2"
          >
            内容を見る
          </TrackedProductLink>
        </p>
      )}

      <MunicipalityRankingExplorer
        rankingKey={item.rankingKey}
        yearCode={snapshot.yearCode}
        unit={snapshot.unit}
        precision={precision}
        total={snapshot.values.length}
        initialCount={topRows.length}
        prefectures={prefectures.map(({ prefCode, prefName }) => ({ prefCode, prefName }))}
      >
        <ValueTable
          columns={[
            { key: 'rank', header: '順位', className: 'w-20' },
            { key: 'area', header: '市区町村', rowHeader: true, align: 'left' },
            { key: 'value', header: '値' },
          ]}
          rows={topRows.map((row) => ({
            key: row.areaCode,
            cells: [
              `${row.rank}位`,
              // 配信値の市区町村は市区町村ページの公開対象と同じ集合なので、全行をリンクにする
              <Link key="area" href={hrefFor('city', { areaCode: row.prefectureCode, cityCode: row.areaCode })}>
                {listName(row.areaName)}
              </Link>,
              `${formatValue(row.value)} ${formatUnitForDisplay(snapshot.unit)}`,
            ],
          }))}
        />
      </MunicipalityRankingExplorer>

      {rowAfterTable.length > 0 && (
        <div className="mt-8">
          <AdRow cells={rowAfterTable} position="municipality-row-2" trackingCategory={`municipality-${item.rankingKey}`} wide />
        </div>
      )}

      {commentary && <MunicipalityRankingCommentary content={commentary} />}

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
    </ArticleShell>
  );
}
