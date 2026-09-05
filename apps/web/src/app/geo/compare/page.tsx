import Link from 'next/link';
import { notFound } from 'next/navigation';

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
    '都道府県を1つ選び、人口変化、住宅地点と人口減少の重なり、浸水想定区域内人口、駅800m圏人口を確認し、県内の判定地図へ進みます。',
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
  if (rows.length !== 47) notFound();

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
        description="住宅地点と人口減少の重なり、浸水想定区域内人口、駅800m圏人口を一県ずつ確認し、県内の詳しい地図へ進みます。各分析の分母や判定条件は異なります。"
        stats="47都道府県 ・ 4つの問い ・ 3つの空間演算"
      />

      <GeoDecisionExplorer rows={rows} initialAreaCode={pref} />

      <SectionHeader
        title="比較するときの注意"
        description="この画面は各分析の集計を並べる入口です。住宅・洪水・駅の三条件を同じ地点で同時に満たすことは判定していません。"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard className="p-5">
          <h3 className="font-bold">詳しい場所は個別の地図へ</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            県内の中心部や郊外の違いは集計値に隠れます。各カードから選択県の判定地図へ進めます。
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
