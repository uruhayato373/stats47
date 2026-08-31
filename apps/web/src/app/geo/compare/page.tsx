import Link from 'next/link';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceCard } from '@/components/surface';

import {
  GeoAnalysisTracker,
  GeoDecisionExplorer,
  buildGeoDecisionRows,
  loadGeoAnalysisSnapshot,
} from '@/features/geo-analysis';

import type { Metadata } from 'next';

interface PageProps {
  searchParams: Promise<{ pref?: string }>;
}

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'あなたの県を人口・地価・洪水・駅で比較 | stats47地域分析',
  description:
    '都道府県を1つ選び、2050年人口、住宅地価、洪水浸水想定区域内人口、駅800m圏人口を同じ画面で比較します。',
  alternates: { canonical: '/geo/compare' },
};

export default async function GeoComparePage({ searchParams }: PageProps) {
  const [{ pref }, landPrice, floodRisk, stationAccess] = await Promise.all([
    searchParams,
    loadGeoAnalysisSnapshot('population-land-price'),
    loadGeoAnalysisSnapshot('population-flood-risk'),
    loadGeoAnalysisSnapshot('population-station-access'),
  ]);
  const rows =
    landPrice && floodRisk && stationAccess
      ? buildGeoDecisionRows(landPrice, floodRisk, stationAccess)
      : [];

  return (
    <PageShell>
      <GeoAnalysisTracker
        analysisId="m1-geo-decision-compare"
        analysisSlug="compare"
        geography="prefecture"
        dataVersion="2020-2050"
      />
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: '1県を4つの問いで比較' },
        ]}
      />
      <PageHeader
        eyebrow="GeoAI 横断比較"
        title="1つの県を、4つの問いで読む"
        description="あなたの県は2050年に何人暮らすか。住宅地価格はどう動いているか。洪水浸水想定区域と駅800m圏に何人暮らすか。都道府県を一度選ぶだけで横断できます。"
        stats="47都道府県 ・ 4つの問い ・ 3つの空間演算"
      />

      {rows.length === 47 ? (
        <GeoDecisionExplorer rows={rows} initialAreaCode={pref} />
      ) : (
        <div role="status" className="border bg-muted/20 p-5 text-sm text-muted-foreground">
          3分析すべての47都道府県データが揃うまで、横断比較の公開表示を止めています。
        </div>
      )}

      <SectionHeader
        title="この画面がランキングと違う理由"
        description="1位を探すのではなく、同じ地域に複数の条件がどう重なるかを確認します。"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard className="p-5">
          <h3 className="font-bold">同じ地域コードで結合</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            人口・地価・洪水・駅の結果を、同じ5桁都道府県コードで結びます。
          </p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <h3 className="font-bold">人数と比率を分ける</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            規模が大きい県と割合が高い県を混同せず、両方を表示します。
          </p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <h3 className="font-bold">限界から先に確認</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            代表点、直線距離、中心点判定など、結果を使える範囲も記事ごとに示します。
          </p>
        </SurfaceCard>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        空間処理と利用上の停止線は{' '}
        <Link className="font-medium text-primary underline" href="/geo/method">
          GeoAIの方法・限界
        </Link>
        で確認できます。
      </p>
    </PageShell>
  );
}
