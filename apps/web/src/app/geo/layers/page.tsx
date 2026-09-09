import Link from 'next/link';

import { GIS_DATASETS } from '@stats47/gis/mlit-ksj';

import { ContentDisclosure } from '@/components/content';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SurfaceCard } from '@/components/surface';

import {
  GeoLayerCards,
  GeoSourceDirectory,
  GeoSourceNavigation,
  loadGeoSourceCatalog,
} from '@/features/geo-analysis';

import type { Metadata } from 'next';

export const revalidate = 86400;
export const metadata: Metadata = {
  title: 'GISを探す | stats47',
  description:
    '土地・自然、区域・防災、施設、交通、統計のGISを一覧から選び、位置・形状・属性を単体の地図で確認できます。',
  alternates: { canonical: '/geo/layers' },
};
export default async function GeoLayersPage() {
  const catalog = await loadGeoSourceCatalog();
  const sources =
    catalog?.items.flatMap((item) => {
      const meta = GIS_DATASETS.find((d) => d.dataId === item.dataId);
      return meta
        ? [
            {
              dataId: meta.dataId,
              name: meta.name,
              category: meta.category,
              geometryType: meta.geometryType,
              latestVersion: item.version,
              sourcePageUrl: item.sourceUrl,
              href: `/geo/datasets/${item.dataId}`,
              assetCount: item.assetCount,
            },
          ]
        : [];
    }) ?? [];
  return (
    <PageShell rightRail={<GeoSourceNavigation catalog={catalog} />}>
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: 'GISを探す' },
        ]}
      />
      <PageHeader
        title="GISを探す"
        description="まず一つのデータを地図で見る。分布や属性を確かめてから、ほかのデータと重ねて読み進められます。"
      />
      <GeoSourceNavigation catalog={catalog} mobile />
      <h2 className="mb-4 text-base font-semibold">
        単体の地図で見られるデータ
      </h2>
      <section className="mb-8" aria-label="公開GIS一覧">
        <p className="mb-4 text-sm">
          {sources.length}
          種類のGISを、点・線・区域・メッシュの単体地図で確認できます。配布区画を選んで読み込み、原典の形状と属性を調べられます。
        </p>
        {catalog ? (
          <GeoSourceDirectory entries={sources} />
        ) : (
          <p role="alert">
            公開GIS一覧を取得できませんでした。再読み込みしてください。
          </p>
        )}
      </section>
      <h2 className="mb-4 text-base font-semibold">
        人口との重ね合わせに使う3つの表示
      </h2>
      <GeoLayerCards />
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        カードは東京都本土（島しょを除く）の表示例です。各地図で47都道府県に切り替えられます。原典から抽出・整理した範囲を表示します。境界：国土数値情報をもとに{' '}
        <a href="https://geoshape.ex.nii.ac.jp/" className="underline">
          NIIが加工
        </a>
        （2023年、表示用に加工、
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          className="underline"
        >
          CC BY-SA 4.0
        </a>
        ）。
      </p>
      <SurfaceCard className="mt-6">
        <h2 className="font-semibold">洪水浸水想定区域</h2>
        <p className="mt-2 text-sm leading-relaxed">
          洪水浸水想定（A31a・A31b）や内水浸水想定（A51）を、上の一覧から選べます。浸水区域の位置・形状を確かめた後、人口と重なる範囲を分析ページで確認できます。人口メッシュの判定結果は、原典の区域形状とは異なります。
        </p>
        <Link
          href="/geo/population-flood-risk"
          className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          人口との重ね合わせ・原典を確認する
        </Link>
      </SurfaceCard>
      <ContentDisclosure
        title={`登録カタログ（公開対象外を含む${GIS_DATASETS.length}件）`}
        className="mt-6"
      >
        <p className="mb-4 text-sm">
          収録候補を含む登録一覧です。すべてがサイト内で閲覧できるわけではありません。年度・範囲・利用条件は原典の確認が必要です。
        </p>
        <GeoSourceDirectory
          entries={GIS_DATASETS.map(
            ({
              dataId,
              name,
              category,
              geometryType,
              latestVersion,
              sourcePageUrl,
            }) => ({
              dataId,
              name,
              category,
              geometryType,
              latestVersion,
              sourcePageUrl,
            })
          )}
        />
      </ContentDisclosure>
    </PageShell>
  );
}
