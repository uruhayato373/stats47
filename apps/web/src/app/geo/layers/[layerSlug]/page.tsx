import Link from 'next/link';
import { notFound } from 'next/navigation';

import { findGeoLayer } from '@stats47/data-configs/business-plan';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SurfaceCard } from '@/components/surface';

import {
  GeoLayerExplorer,
  GeoSourceNavigation,
  loadGeoSourceCatalog,
  projectGeoLayer,
  loadGeoAnalysisPrefBundle,
  loadGeoAnalysisSnapshot,
} from '@/features/geo-analysis';

import type { Metadata } from 'next';

export const revalidate = 86400;
type Props = {
  params: Promise<{ layerSlug: string }>;
  searchParams: Promise<{ pref?: string }>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { layerSlug } = await params;
  const layer = findGeoLayer(layerSlug);
  return {
    title: layer ? `${layer.name}の地図 | stats47` : 'GISが見つかりません',
    description: layer?.description,
    alternates: { canonical: `/geo/layers/${layerSlug}` },
  };
}
export default async function GeoLayerPage({ params, searchParams }: Props) {
  const { layerSlug } = await params;
  const layer = findGeoLayer(layerSlug);
  if (!layer) notFound();
  const query = await searchParams;
  const pref =
    typeof query.pref === 'string' &&
    /^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(query.pref)
      ? query.pref
      : '13';
  const [bundle, snapshot, catalog] = await Promise.all([
    loadGeoAnalysisPrefBundle(layer.sourceAnalysis, pref),
    loadGeoAnalysisSnapshot(layer.sourceAnalysis),
    loadGeoSourceCatalog(),
  ]);
  const data = bundle ? projectGeoLayer(layer.slug, bundle.detail) : null;
  return (
    <PageShell
      rightRail={
        <GeoSourceNavigation catalog={catalog} currentDataId={layer.dataId} />
      }
    >
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: 'GISを探す', href: '/geo/layers' },
          { label: layer.name },
        ]}
      />
      <PageHeader
        title={layer.name}
        description={layer.description}
        meta={layer.representation}
      />
      <GeoSourceNavigation
        catalog={catalog}
        currentDataId={layer.dataId}
        mobile
      />
      {bundle &&
      data &&
      snapshot &&
      snapshot.generatedAt === bundle.manifest.generatedAt ? (
        <GeoLayerExplorer
          key={`${layer.slug}-${pref}-${bundle.manifest.generatedAt}`}
          layer={layer}
          manifest={bundle.manifest}
          initialPref={pref}
          initialData={data}
        />
      ) : (
        <SurfaceCard>
          <p role="alert">
            データの整合性を確認できませんでした。時間をおいて再読み込みしてください。
          </p>
        </SurfaceCard>
      )}
      <SurfaceCard className="mt-6 space-y-3">
        <h2 className="font-semibold">この地図で分かること</h2>
        <p className="text-sm leading-relaxed">{layer.reading}</p>
        <h2 className="font-semibold">表示範囲と読み方の注意</h2>
        <p className="text-sm leading-relaxed">{layer.limitation}</p>
      </SurfaceCard>
      <SurfaceCard className="mt-6 space-y-3">
        <h2 className="font-semibold">出典・データ年度</h2>
        {snapshot?.sources
          .filter((s) => s.datasetId === layer.dataId)
          .map((s) => (
            <p key={s.datasetId} className="break-words text-sm">
              <a href={s.url} className="text-primary underline">
                {s.name}
              </a>
              <br />
              原典バージョン：{s.version}／{s.license}
            </p>
          ))}
        <p className="text-xs text-muted-foreground">
          {bundle
            ? `表示データ作成：${bundle.manifest.generatedAt.slice(0, 10)}`
            : '現在、出典情報を取得できません。'}
        </p>
        <Link
          href="/geo/data-catalog"
          className="inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          加工方法と分析の出典を確認する
        </Link>
      </SurfaceCard>
    </PageShell>
  );
}
