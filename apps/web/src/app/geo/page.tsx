import Link from 'next/link';

import { BUSINESS_PLAN_M1 } from '@stats47/data-configs/business-plan';
import { GIS_DATASETS } from '@stats47/gis/mlit-ksj';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import {
  SurfaceCard,
  SurfaceLinkCard,
} from '@/components/surface';

import type { Metadata } from 'next';

const title = '地域データ分析 | stats47';
const description =
  '複数のGISレイヤーを空間演算で重ね、将来人口、地価、洪水浸水想定、駅アクセスを地域の判断材料へ変えるGeoAI分析です。';

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
        eyebrow="GeoAI 地域分析"
        title="地図を重ねて、地域の次の判断をつくる"
        description="GeoAIは都道府県順位の言い換えではありません。複数の地理レイヤーを決定的な空間演算で重ね、どこで何が重なるかを問い・地図・比較・方法の順に確認します。"
        stats="4分析 ・ 5入力レイヤー ・ すべて47都道府県 ・ 1kmメッシュ/GISから集計"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <SurfaceCard className="p-5">
          <p className="text-xs font-semibold text-primary">1. レイヤー</p>
          <h3 className="mt-2 text-base font-bold">場所を持つデータを選ぶ</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            人口メッシュ、地点、駅、浸水ポリゴンなど、分析の問いに必要な地理データを組み合わせます。
          </p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <p className="text-xs font-semibold text-primary">2. 空間演算</p>
          <h3 className="mt-2 text-base font-bold">包含・距離・集約を計算する</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            中心点の包含判定、駅から800mの距離判定、県コード結合を決定的コードで再現します。
          </p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <p className="text-xs font-semibold text-primary">3. 判断</p>
          <h3 className="mt-2 text-base font-bold">地域差と限界を同時に読む</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            地図だけで結論にせず、47県比較、入力件数、出典、近似条件まで同じ記事で確かめられます。
          </p>
        </SurfaceCard>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <SurfaceLinkCard href="/geo/compare" className="block border-primary/40 p-5">
          <p className="text-xs font-semibold text-primary">都道府県を選ぶ</p>
          <h3 className="mt-2 text-lg font-bold">1つの県を4つの問いで読む</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            2050年人口、住宅地価、浸水想定区域内人口、駅800m圏人口を同じ画面で横断します。
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-primary">
            あなたの県を比較する →
          </span>
        </SurfaceLinkCard>
        <SurfaceLinkCard href="/geo/method" className="block p-5">
          <p className="text-xs font-semibold text-primary">方法・説明責任</p>
          <h3 className="mt-2 text-lg font-bold">地図が答えられないことも読む</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            地点集計、ポリゴン包含、800m距離判定と、それぞれの利用上の停止線を確認します。
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-primary">
            空間処理と限界を見る →
          </span>
        </SurfaceLinkCard>
      </div>

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

      <SectionHeader
        title="ランキング・テーマとの違い"
        description="同じ統計サイト内でも、答える問いと必要なデータ契約を分けています。"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard className="p-5">
          <h3 className="font-bold">ランキング</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            1指標を47都道府県で比較し、「何位か」に答えます。
          </p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <h3 className="font-bold">テーマ</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            人口・医療・交通など、複数指標を同じ主題で横断します。
          </p>
        </SurfaceCard>
        <SurfaceCard className="border-primary/40 p-5">
          <h3 className="font-bold">GeoAI</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            複数のGISレイヤーを重ね、「どこで重なるか」「距離条件を満たすか」から判断します。
          </p>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-primary">GISデータカタログ</p>
          <h3 className="mt-1 text-lg font-bold">登録{GIS_DATASETS.length}データセットをライセンス別に管理</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            取得済み、分析利用中、公開R2可、要ライセンス確認、ローカル限定を区別しています。
          </p>
        </div>
        <Link className="shrink-0 text-sm font-medium text-primary underline" href="/geo/data-catalog">
          データカタログを見る →
        </Link>
      </SurfaceCard>

      <p className="mt-6 text-xs text-muted-foreground">
        M1対象月: {BUSINESS_PLAN_M1.month}
        。直URLとSNSの着地ページとして利用できます。GA4カスタムディメンション登録・反映とthin-content監査を満たすまで、検索indexとグローバルナビへの露出は行いません。{' '}
        <Link className="underline" href="/about">
          stats47について
        </Link>
      </p>
    </PageShell>
  );
}
