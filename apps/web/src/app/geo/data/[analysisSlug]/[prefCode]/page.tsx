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
} from '@/features/geo-analysis';

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ analysisSlug: string; prefCode: string }>;
}

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { analysisSlug } = await params;
  return {
    title: 'Geo分析の記事制作用データ | stats47',
    description: 'Geo分析の県別途中artifact、入力、空間演算、保存則を確認できます。',
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
    return detail.landPricePoints.slice(0, 20).map((point) => ({
      id: point[0],
      kind: '住宅地地点',
      value: `${point[3].toLocaleString('ja-JP')}円/㎡ / ${point[4] === null ? '変動率なし' : `${point[4]}%`}`,
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
          { label: `${detail.areaName}の制作データ` },
        ]}
      />
      <PageHeader
        eyebrow="記事制作用データ"
        title={`${detail.areaName}｜${config.shortTitle}の途中artifact`}
        description="記事・図解・有料レポートを同じ根拠から作るための閲覧画面です。数値の正典はaggregate、地図の途中経過は県別artifact、再現情報はmanifestに分離しています。"
        stats={`coverage ${manifest.quality.detailAreas}/47 ・ 保存則 ${manifest.quality.conservationChecks}/47`}
      />

      <SurfaceSection>
        <SectionHeader title="この県の検算済み集計" hideRule />
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(detail.summary).map(([key, value]) => (
            <div key={key} className="border-l-2 border-primary pl-3">
              <dt className="text-xs text-muted-foreground">
                {summaryLabels[key] ?? key}
              </dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {typeof value === 'number' ? value.toLocaleString('ja-JP') : String(value)}
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
        <SectionHeader title="取得・公開経路" hideRule />
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
