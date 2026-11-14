import { notFound } from 'next/navigation';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { hrefFor } from '@stats47/data-configs/content/href';
import {
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  type GeoAnalysisPrefDetail,
} from '@stats47/gis';

import { ExternalAnchor } from "@/components/atoms/ExternalAnchor";
import Link from '@/components/atoms/SiteLink';
import { Breadcrumbs, PageHeader, PageShell, PanelGrid } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { StatTile, StatTileGrid, SurfaceSection, ValueTable } from '@/components/surface';

import {
  GEO_CROSS_ANALYSIS_CONFIGS,
  geoAnalysisPublicDataUrl,
  isGeoCrossAnalysisSlug,
  GeoSpatialEvidenceExplorer,
  spatialAuditRows,
  PUBLIC_FACILITY_BAND_LABELS,
  loadGeoAnalysisPrefBundle,
} from '@/features/geo-analysis';

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ analysisSlug: string; prefCode: string }>;
}

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { analysisSlug } = await params;
  return {
    title: '地域分析の県別地図・検算データ',
    description:
      '選択県の人口メッシュ、地点の空間判定、集計の分母と出典を確認できます。',
    alternates: {
      canonical: isGeoCrossAnalysisSlug(analysisSlug)
        ? hrefFor('geo', { analysisSlug })
        : '/geo',
    },
    robots: { index: false, follow: true },
  };
}

const summaryLabels: Record<string, string> = {
  meshCount: '人口メッシュ数',
  pointCount: '地価地点数',
  matchedPointCount: '人口メッシュ接続地点',
  unmatchedPointCount: '人口メッシュ未接続地点',
  comparablePointCount: '比較可能地点（分母）',
  risingDecliningPointCount: '地価上昇×人口減少地点',
  risingDecliningPointShare: '地価上昇×人口減少の地点比率',
  displayedStationCount: '表示対象駅数',
  accessibleMeshCount: '駅800m圏メッシュ数',
  exposedMeshCount: '浸水想定区域内メッシュ数',
  population2020: '2020年人口',
  population2050: '2050年人口',
  accessiblePopulation2020: '2020年駅圏人口',
  accessiblePopulation2050: '2050年駅圏人口',
  exposedPopulation2020: '2020年区域内人口',
  exposedPopulation2050: '2050年区域内人口',
  stationAccessShare2020: '2020年駅圏人口比率',
  stationAccessShare2050: '2050年駅圏人口比率',
  floodExposureShare2020: '2020年区域内人口比率',
  floodExposureShare2050: '2050年区域内人口比率',
  medianResidentialLandPrice: '住宅地地価中央値',
  medianLandPriceChange: '住宅地地価変動率中央値',
  populationChangeRate: '2050年人口増減率',
};

function valueUnit(key: string): string {
  if (/Share|Rate|Change/.test(key)) return '%';
  if (key === 'medianResidentialLandPrice') return '円/㎡';
  if (/Population|population/.test(key)) return '人';
  return '';
}

/** 集計の値の表示。人数はメッシュの按分で小数が残る (14,047,593.999人) ので整数に丸める。比率・地価は集計の値のまま */
function summaryValue(key: string, value: number): string {
  return (valueUnit(key) === '人' ? Math.round(value) : value).toLocaleString('ja-JP');
}

/** 「この県の検算済み集計」の数値タイル。式で検算を見せる分析は検算の行を、それ以外は集計の項目をそのまま 1 枚にする */
function summaryTiles(detail: GeoAnalysisPrefDetail): Array<{
  label: string;
  value: string | null;
  unit?: string;
  /** 検算の内訳の式 (値の下の補足) */
  meta?: string;
}> {
  if (
    detail.slug === 'population-public-facility-access' ||
    detail.slug === 'population-snow-designation' ||
    detail.slug === 'population-landslide-exposure' ||
    detail.slug === 'population-low-elevation'
  )
    return spatialAuditRows(detail);
  return Object.entries(detail.summary).map(([key, value]) => ({
    label: summaryLabels[key] ?? key,
    value: typeof value === 'number' ? summaryValue(key, value) : null,
    unit: valueUnit(key) || undefined,
  }));
}

function previewRows(detail: GeoAnalysisPrefDetail): Array<{
  id: string;
  kind: string;
  value: string;
}> {
  if (detail.slug === 'population-landslide-exposure') return detail.meshes.slice(0,20).map(m=>({id:`${m[1]}:${m[0]}`,kind:'250m人口メッシュ・土砂災害指定区域の中心包含',value:`2020年基準人口 ${(m[2]/10000).toLocaleString('ja-JP')}人 / ${m[3]&56?'特別警戒':m[3]?'警戒のみ':'今回の入力面外'}`}));
  if (detail.slug === 'population-snow-designation') return detail.meshes.slice(0,20).map(m=>({id:`${m[1]}:${m[0]}`,kind:'250m人口メッシュ・豪雪中心包含',value:`2020年基準人口 ${(m[2]/10000).toLocaleString('ja-JP')}人 / ${['入力区域外','通常豪雪','特別豪雪'][m[3]]}${m[4]&16?' / 指定境界を横切る格子':''}`}));
  if (detail.slug === 'population-low-elevation')
    return detail.meshes.slice(0, 20).map((mesh) => ({
      id: `${mesh[1]}:${mesh[0]}`,
      kind: '1kmメッシュ人口・平均標高',
      value: `2020年 ${mesh[2].toLocaleString('ja-JP')}人 / ${mesh[3] === null ? '標高不明' : `平均${mesh[3]}m・最高${mesh[4]}m・最低${mesh[5]}m`}`,
    }));
  if (detail.slug === 'population-public-facility-access') {
    const facilities = new Map(
      detail.facilities.map((point) => [point[0], point])
    );
    return detail.meshes.slice(0, 20).map((mesh) => ({
      id: mesh[0],
      kind: '人口メッシュ・最寄り公共施設',
      value: `2020年 ${mesh[3].toLocaleString('ja-JP')}人 / 2050年 ${mesh[4].toLocaleString('ja-JP')}人。行政施設 ${facilities.get(mesh[5])?.[4] ?? '—'} ${mesh[6].toFixed(1)}m（${PUBLIC_FACILITY_BAND_LABELS[mesh[7]]}）、集会施設 ${facilities.get(mesh[8])?.[4] ?? '—'} ${mesh[9].toFixed(1)}m（${PUBLIC_FACILITY_BAND_LABELS[mesh[10]]}）`,
    }));
  }
  if (detail.slug === 'population-land-price') {
    return detail.landPricePoints.slice(0, 20).map((point, index) => ({
      id: point[0],
      kind: '住宅地地点',
      value: `${point[3].toLocaleString('ja-JP')}円/㎡ / ${point[4] === null ? '変動率なし' : `${point[4]}%`} / 人口メッシュ ${detail.pointMeshIds[index] ?? '未接続'}`,
    }));
  }
  if (detail.slug === 'population-flood-risk') {
    return detail.meshes
      .filter((mesh) => mesh[7] > 0)
      .slice(0, 20)
      .map((mesh) => ({
        id: mesh[0],
        kind: '区域内人口メッシュ',
        value: `2050年 ${mesh[6].toLocaleString('ja-JP')}人 / 浸水深区分 ${mesh[7]}`,
      }));
  }
  return detail.stations.slice(0, 20).map((station) => ({
    id: station[0],
    kind: '駅代表点',
    value: station[1],
  }));
}

export default async function GeoArticleDataPage({ params }: PageProps) {
  const { analysisSlug, prefCode } = await params;
  if (
    !isGeoCrossAnalysisSlug(analysisSlug) ||
    !PREFECTURE_LIST_2DIGIT.some((prefecture) => prefecture.code === prefCode)
  ) {
    notFound();
  }
  const bundle = await loadGeoAnalysisPrefBundle(analysisSlug, prefCode);
  if (!bundle) notFound();
  const { manifest, detail } = bundle;
  const config = GEO_CROSS_ANALYSIS_CONFIGS[analysisSlug];
  const previews = previewRows(detail);
  const detailKey = geoAnalysisPrefKey(analysisSlug, prefCode);

  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: config.shortTitle, href: hrefFor('geo', { analysisSlug }) },
          { label: `${detail.areaName}の地図・検算データ` },
        ]}
      />
      <PageHeader
        eyebrow="県別の地図・検算"
        title={`${detail.areaName}｜${config.shortTitle}`}
        description="地図上の判定と集計の根拠を確認できます。地点・メッシュの全件データと、使用した一次資料の情報も取得できます。"
        stats={`詳細地域 ${manifest.quality.detailAreas}/47 ・ 合計一致の検算 ${manifest.quality.conservationChecks}/47`}
      />

      <GeoSpatialEvidenceExplorer
        slug={analysisSlug}
        analysisId={`geo-data-${analysisSlug}`}
        dataVersion={manifest.generatedAt}
        initialPrefCode={prefCode}
        initialView="overlap"
        manifest={manifest}
        fixedPrefecture
      />

      <PanelGrid as="section">
        <SectionHeader title="この県の検算済み集計" hideRule />
        <StatTileGrid>
          {/* 検算の行は結果 (合計・比率) を値に、内訳の式を値の下の補足に出す */}
          {summaryTiles(detail).map((tile) => (
            <StatTile
              key={tile.label}
              label={tile.label}
              value={tile.value}
              unit={tile.unit}
              meta={tile.meta}
            />
          ))}
        </StatTileGrid>
      </PanelGrid>

      <SurfaceSection className="mt-6">
        <SectionHeader
          title="途中データのプレビュー"
          description="画面負荷を抑えるため先頭20件だけ表示します。全件はJSONから取得できます。"
          hideRule
        />
        <div className="mt-4 overflow-x-auto">
          {previews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {detail.slug === 'population-flood-risk'
                ? '今回の入力・中心点判定では、浸水想定区域内の人口メッシュはありません。洪水の安全性を示すものではありません。'
                : 'プレビュー対象の地点はありません。集計値と全件JSONを確認してください。'}
            </p>
          ) : (
            <ValueTable
              columns={[
                { key: 'id', header: 'ID', rowHeader: true },
                { key: 'kind', header: '種類', align: 'left' },
                { key: 'value', header: '値', align: 'left' },
              ]}
              rows={previews.map((row) => ({
                key: row.id,
                cells: [<span key="id" className="font-mono">{row.id}</span>, row.kind, row.value],
              }))}
            />
          )}
        </div>
      </SurfaceSection>

      <SurfaceSection className="mt-6">
        <SectionHeader title="全件データと出典の取得" hideRule />
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <ExternalAnchor
              className="font-medium text-primary underline"
              href={geoAnalysisPublicDataUrl(detailKey)}
            >
              {detail.areaName}の途中artifact JSON
            </ExternalAnchor>
          </li>
          <li>
            <ExternalAnchor
              className="font-medium text-primary underline"
              href={geoAnalysisPublicDataUrl(
                `app/geo/${analysisSlug}/item.json`
              )}
            >
              47都道府県aggregate JSON
            </ExternalAnchor>
          </li>
          <li>
            <ExternalAnchor
              className="font-medium text-primary underline"
              href={geoAnalysisPublicDataUrl(
                geoAnalysisManifestKey(analysisSlug)
              )}
            >
              入力データの指紋・空間演算・合計一致の検算記録
            </ExternalAnchor>
          </li>
          {manifest.stages
            .find((stage) => stage.id === 'public-facility-points')
            ?.outputs.filter((output) => output.areaCode === detail.areaCode)
            .map((output) => (
              <li key={output.key}>
                <ExternalAnchor
                  className="font-medium text-primary underline"
                  href={geoAnalysisPublicDataUrl(output.key)}
                >
                  この県の全原典施設・検証済みJSON
                </ExternalAnchor>
              </li>
            ))}
          <li>
            <Link
              className="font-medium text-primary underline"
              href={`${hrefFor('geo', { analysisSlug })}?pref=${prefCode}#article-data`}
            >
              公開Geo分析へ戻る
            </Link>
          </li>
          <li>
            <Link
              className="font-medium text-primary underline"
              href={hrefFor('area', { areaCode: detail.areaCode })}
            >
              {detail.areaName}の統計ページ
            </Link>
          </li>
        </ul>
      </SurfaceSection>
    </PageShell>
  );
}
