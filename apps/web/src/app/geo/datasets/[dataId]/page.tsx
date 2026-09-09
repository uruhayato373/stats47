import Link from 'next/link';
import { notFound } from 'next/navigation';

import { findGeoSourcePage } from '@stats47/data-configs/business-plan';
import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SurfaceCard } from '@/components/surface';

import {
  GeoSourceExplorer,
  GeoSourceNavigation,
  GeoSourceReading,
  loadGeoSourceCatalog,
  loadGeoSourceItem,
} from '@/features/geo-analysis';

import type { Metadata } from 'next';
type Props = { params: Promise<{ dataId: string }> };
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dataId } = await params;
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  const content = findGeoSourcePage(dataId, meta?.latestVersion);
  return {
    title: meta ? `${meta.name}のGIS地図 | stats47` : 'GISが見つかりません',
    description: content?.summary,
    alternates: { canonical: `/geo/datasets/${dataId}` },
  };
}
export default async function GeoDatasetPage({ params }: Props) {
  const { dataId } = await params;
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  if (
    !meta ||
    getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
  )
    notFound();
  const [catalog, item] = await Promise.all([
    loadGeoSourceCatalog(),
    loadGeoSourceItem(dataId),
  ]);
  const content = findGeoSourcePage(dataId, meta.latestVersion);
  return (
    <PageShell
      rightRail={
        <GeoSourceNavigation catalog={catalog} currentDataId={dataId} />
      }
    >
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: 'GISを探す', href: '/geo/layers' },
          { label: meta.name },
        ]}
      />
      <PageHeader
        title={meta.name}
        description={
          content?.summary ??
          '原典から取得・変換したGISの位置・形状と属性を確認できます。'
        }
        meta={`${dataId}・原典版 ${meta.latestVersion}${item ? `・${item.assets.length}配布ファイル` : ''}`}
      />
      <GeoSourceNavigation catalog={catalog} currentDataId={dataId} mobile />
      {content && (
        <dl className="mb-6 space-y-3 text-sm">
          <div>
            <dt className="font-semibold">データの時点</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">
              {content.period}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">対象範囲</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">
              {content.coverage}
            </dd>
          </div>
        </dl>
      )}
      {item ? (
        <GeoSourceExplorer item={item} fields={content?.fields} />
      ) : catalog &&
        !catalog.items.some((source) => source.dataId === dataId) ? (
        <SurfaceCard className="space-y-3">
          <h2 className="font-semibold">地図を準備中</h2>
          <p className="text-sm leading-relaxed">
            {meta.name}
            を単体で確認できるページです。現在、原典データを地図で表示できる形式に整えています。準備ができ次第、このページから閲覧できます。
          </p>
          <Link
            href="/geo/layers"
            className="inline-flex min-h-11 items-center text-sm text-primary underline"
          >
            地図のあるGISを探す
          </Link>
        </SurfaceCard>
      ) : (
        <SurfaceCard>
          <p role="alert">
            このデータの地図ファイルを確認できませんでした。再読み込みしてください。
          </p>
        </SurfaceCard>
      )}
      {content && <GeoSourceReading content={content} />}
      <SurfaceCard className="mt-6 space-y-3">
        <h2 className="font-semibold">出典と表示範囲</h2>
        <p className="text-sm">
          国土交通省「国土数値情報」{meta.name}
          。stats47が表示用に座標・形状・属性を変換しています。変換・簡略化後の地物を表示し、原典の全精度を保証するものではありません。
        </p>
        <p className="text-sm">
          {meta.license === 'cc-by-4.0'
            ? 'CC BY 4.0'
            : '商用利用可能（原典の個別条件を確認）'}
          。初回取得日時はこの一覧では確認できません。原典版と一覧の検証日を区別して掲載しています。
        </p>
        {(item?.sourceUrl || meta.sourcePageUrl) && (
          <a
            href={item?.sourceUrl || meta.sourcePageUrl}
            className="inline-flex min-h-11 items-center text-sm text-primary underline"
          >
            原典・属性項目・利用条件を確認する
          </a>
        )}
        {content?.additionalSources?.map((source) => (
          <a
            key={source.url}
            href={source.url}
            className="flex min-h-11 items-center text-sm text-primary underline"
          >
            {source.label}
          </a>
        ))}
        <p className="text-xs text-muted-foreground">
          一覧検証日：{catalog?.generatedAt.slice(0, 10) ?? '不明'}
        </p>
        <Link
          href="/geo/layers"
          className="inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          ほかのGISを探す
        </Link>
      </SurfaceCard>
    </PageShell>
  );
}
