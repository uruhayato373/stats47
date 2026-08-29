import Link from 'next/link';

import { BUSINESS_PLAN_M1 } from '@stats47/data-configs/business-plan';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import {
  SurfaceCard,
  SurfaceLinkCard,
} from '@/components/surface';

import type { Metadata } from 'next';

const title = '地域データ分析 | stats47';
const description =
  '将来人口、地価、洪水浸水想定、駅アクセスを地図と比較で読み解く、都道府県別の地域分析です。';

const analysisDescriptions: Record<string, string> = {
  '2050-population':
    '2020年から2050年の将来人口増減率を、全国地図・上位下位・最大3県比較で確認します。',
  'population-land-price':
    '2026年住宅地の地価中央値と、2020年から2050年の人口変化を同じ表で比較します。',
  'population-flood-risk':
    '洪水浸水想定区域と1km将来人口メッシュを重ね、区域内人口の比率を比較します。',
  'population-station-access':
    '駅から直線800m以内の人口メッシュを集計し、2020年と2050年の人口比率を比較します。',
};

const analysisLabels: Record<string, string> = {
  '2050-population': '人口・未来',
  'population-land-price': '人口 × 地価',
  'population-flood-risk': '人口 × 洪水',
  'population-station-access': '人口 × 駅',
};

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/geo' },
  robots: { index: false, follow: true },
};

export default function GeoPage() {
  return (
    <PageShell>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: '地域分析' }]}
      />
      <PageHeader
        eyebrow="地域分析"
        title="地域の変化を、地図と比較で読む"
        description="ランキング1件だけでは分からない地域差を、問い・地図・比較・方法の順に確認します。検証済みデータのある分析だけを掲載します。"
        stats="4分析 ・ すべて47都道府県 ・ 1kmメッシュ/GISから集計"
      />

      <SectionHeader
        title="地域分析の記事"
        description="地図で全体像を見て、県を選び、全データと計算方法まで確認できます。"
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {BUSINESS_PLAN_M1.analyses.map((analysis) => (
            <SurfaceLinkCard
              key={analysis.slug}
              href={`/geo/${analysis.slug}`}
              className="block p-5"
            >
              <p className="text-xs font-semibold text-primary">
                {analysisLabels[analysis.slug]} ・ 実データ47件
              </p>
              <h3 className="mt-2 text-lg font-bold">{analysis.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {analysisDescriptions[analysis.slug]}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">
                分析を見る →
              </span>
            </SurfaceLinkCard>
          ))}
        </div>
        <SurfaceCard className="p-5">
          <h3 className="text-base font-bold">公開品質の約束</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>・一次資料、年度、単位、粒度を明記</li>
            <li>・推計を将来の保証として表現しない</li>
            <li>・細かい地域粒度を未検証のまま出さない</li>
          </ul>
        </SurfaceCard>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        M1対象月: {BUSINESS_PLAN_M1.month}
        。このハブは4分析・計測登録・thin-content監査を満たすまで検索indexとグローバルナビへの露出を行いません。{' '}
        <Link className="underline" href="/about">
          stats47について
        </Link>
      </p>
    </PageShell>
  );
}
