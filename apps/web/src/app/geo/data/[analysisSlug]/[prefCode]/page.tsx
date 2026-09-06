import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import {
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  type GeoAnalysisPrefDetail,
} from '@stats47/gis';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';

import {
  GEO_CROSS_ANALYSIS_CONFIGS,
  geoAnalysisPublicDataUrl,
  isGeoCrossAnalysisSlug,
  loadGeoAnalysisManifest,
  loadGeoAnalysisPrefDetail,
  GeoSpatialEvidenceExplorer,
} from '@/features/geo-analysis';

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ analysisSlug: string; prefCode: string }>;
}

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { analysisSlug } = await params;
  return {
    title: '地域分析の県別地図・検算データ | stats47',
    description: '選択県の人口メッシュ、地点の空間判定、集計の分母と出典を確認できます。',
    alternates: {
      canonical: isGeoCrossAnalysisSlug(analysisSlug)
        ? `/geo/${analysisSlug}`
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

function previewRows(detail: GeoAnalysisPrefDetail): Array<{
  id: string;
  kind: string;
  value: string;
}> {
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
  const [manifest, detail] = await Promise.all([
    loadGeoAnalysisManifest(analysisSlug),
    loadGeoAnalysisPrefDetail(analysisSlug, prefCode),
  ]);
  if (!manifest || !detail) notFound();
  const config = GEO_CROSS_ANALYSIS_CONFIGS[analysisSlug];
  const previews = previewRows(detail);
  const detailKey = geoAnalysisPrefKey(analysisSlug, prefCode);

  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: config.shortTitle, href: `/geo/${analysisSlug}` },
          { label: `${detail.areaName}の地図・検算データ` },
        ]}
      />
      <PageHeader
        eyebrow="県別の地図・検算"
        title={`${detail.areaName}｜${config.shortTitle}`}
        description="地図上の判定と集計の根拠を確認できます。地点・メッシュの全件データと、使用した一次資料の情報も取得できます。"
        stats={`coverage ${manifest.quality.detailAreas}/47 ・ 保存則 ${manifest.quality.conservationChecks}/47`}
      />

      <GeoSpatialEvidenceExplorer slug={analysisSlug} analysisId={`geo-data-${analysisSlug}`} dataVersion={manifest.generatedAt} initialPrefCode={prefCode} initialView="overlap" manifest={manifest} fixedPrefecture />

      <SurfaceSection>
        <SectionHeader title="この県の検算済み集計" hideRule />
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(detail.summary).map(([key, value]) => (
            <div key={key} className="border p-3">
              <dt className="text-xs text-muted-foreground">
                {summaryLabels[key] ?? key}
              </dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {typeof value === 'number' ? value.toLocaleString('ja-JP') : '—'}
                {valueUnit(key)}
              </dd>
            </div>
          ))}
        </dl>
      </SurfaceSection>

      <SurfaceSection className="mt-6">
        <SectionHeader
          title="途中データのプレビュー"
          description="画面負荷を抑えるため先頭20件だけ表示します。全件はJSONから取得できます。"
          hideRule
        />
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>種類</TableHead>
                <TableHead>値</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    {detail.slug === 'population-flood-risk'
                      ? '今回の入力・中心点判定では、浸水想定区域内の人口メッシュはありません。洪水の安全性を示すものではありません。'
                      : 'プレビュー対象の地点はありません。集計値と全件JSONを確認してください。'}
                  </TableCell>
                </TableRow>
              )}
              {previews.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell>{row.kind}</TableCell>
                  <TableCell className="tabular-nums">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SurfaceSection>

      <SurfaceSection className="mt-6">
        <SectionHeader title="全件データと出典の取得" hideRule />
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <a className="font-medium text-primary underline" href={geoAnalysisPublicDataUrl(detailKey)}>
              {detail.areaName}の途中artifact JSON
            </a>
          </li>
          <li>
            <a
              className="font-medium text-primary underline"
              href={geoAnalysisPublicDataUrl(`app/geo/${analysisSlug}/item.json`)}
            >
              47都道府県aggregate JSON
            </a>
          </li>
          <li>
            <a
              className="font-medium text-primary underline"
              href={geoAnalysisPublicDataUrl(geoAnalysisManifestKey(analysisSlug))}
            >
              入力SHA・空間演算・保存則manifest
            </a>
          </li>
          <li>
            <Link className="font-medium text-primary underline" href={`/geo/${analysisSlug}?pref=${prefCode}#article-data`}>
              公開Geo分析へ戻る
            </Link>
          </li>
          <li>
            <Link className="font-medium text-primary underline" href={`/areas/${detail.areaCode}`}>
              {detail.areaName}の統計ページ
            </Link>
          </li>
        </ul>
      </SurfaceSection>
    </PageShell>
  );
}
