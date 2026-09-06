import Link from 'next/link';

import { BUSINESS_PLAN_M1_GEO_ANALYSES } from '@stats47/data-configs/business-plan';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceLinkCard } from '@/components/surface';

import { POPULATION_BASELINE_RANKING_PATH } from '@/config/geo-redirects';
import { GEO_CROSS_ANALYSIS_CONFIGS, isGeoCrossAnalysisSlug } from '@/features/geo-analysis';

import type { Metadata } from 'next';

const title = '地域データ分析 | stats47';
const description =
  '複数のGISレイヤーを空間演算で重ね、将来人口、地価、洪水浸水想定、駅アクセスを地域の判断材料へ変えるGeoAI分析です。';

const analysisLabels: Record<string, string> = {
  'population-land-price': '人口 × 地価',
  'population-flood-risk': '人口 × 洪水',
  'population-station-access': '人口 × 駅',
};

const CALCULATION_INPUT_LAYER_COUNT = new Set(
  BUSINESS_PLAN_M1_GEO_ANALYSES.flatMap((analysis) =>
    analysis.sourceLayers
      .filter((layer) => layer.role === 'calculation-input')
      .map((layer) => layer.id)
  )
).size;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/geo' },
};

export default function GeoPage() {
  return (
    <PageShell>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: '地域分析' }]}
      />
      <PageHeader
        eyebrow="地域の空間分析"
        title="人口が変わる場所を、住宅地・洪水・駅と重ねる"
        description="県を選んで1kmメッシュを拡大し、住宅地点、浸水の想定範囲、駅との距離を確かめます。地域を詳しく調べるための問いから、分析を選んでください。"
        stats={`${BUSINESS_PLAN_M1_GEO_ANALYSES.length}分析 ・ ${CALCULATION_INPUT_LAYER_COUNT}計算入力レイヤー ・ すべて47都道府県 ・ 1kmメッシュ/GISから集計`}
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
          <h3 className="mt-2 text-base font-bold">
            包含・距離・集約を計算する
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            住宅地点が入る人口メッシュ、浸水区域に入る中心点、駅から800m以内の中心点をそれぞれ判定します。
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

      <SurfaceLinkCard
        href={POPULATION_BASELINE_RANKING_PATH}
        className="mb-8 block border-primary/40 p-5"
      >
        <p className="text-xs font-semibold text-primary">
          空間分析の基準データ（ランキング）
        </p>
        <h3 className="mt-2 text-lg font-bold">
          2050年の人口増減率を47都道府県で確認する
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          地点やメッシュへ進む前に、各県の人口変化を大づかみに確認したいときに使えます。人口推計の定義と出典も掲載しています。
        </p>
        <span className="mt-4 inline-block text-sm font-medium text-primary">
          2050年人口増減率ランキングを見る →
        </span>
      </SurfaceLinkCard>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <SurfaceLinkCard
          href="/geo/compare"
          className="block border-primary/40 p-5"
        >
          <p className="text-xs font-semibold text-primary">都道府県を選ぶ</p>
          <h3 className="mt-2 text-lg font-bold">
            1つの県を基準値と3つの空間分析で読む
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            住宅地点と人口変化の重なり、浸水想定区域内人口、駅800m圏人口を確認し、選んだ県の詳しい地図へ進めます。
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-primary">
            あなたの県を比較する →
          </span>
        </SurfaceLinkCard>
        <SurfaceLinkCard href="/geo/method" className="block p-5">
          <p className="text-xs font-semibold text-primary">方法・説明責任</p>
          <h3 className="mt-2 text-lg font-bold">
            地図が答えられないことも読む
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            地点とメッシュの接続、洪水区域の包含、駅800mの距離判定について、計算条件と読み取れる範囲を確認します。
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-primary">
            空間処理と限界を見る →
          </span>
        </SurfaceLinkCard>
      </div>

      <SectionHeader
        title="調べたい問いから選ぶ"
        description="各分析で県内の地図を動かし、地点・メッシュの判定と集計を確かめられます。"
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {BUSINESS_PLAN_M1_GEO_ANALYSES.map((analysis) => (
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
                {isGeoCrossAnalysisSlug(analysis.slug) ? GEO_CROSS_ANALYSIS_CONFIGS[analysis.slug].description : analysis.question}
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
          <h3 className="font-bold">空間分析</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            複数のGISレイヤーを重ね、「どこで重なるか」「距離条件を満たすか」から判断します。
          </p>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-primary">
            GISデータカタログ
          </p>
          <h3 className="mt-1 text-lg font-bold">
            分析に使った一次資料と利用条件
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            人口・住宅地点・洪水・駅の対象年度、地理的な粒度、計算での役割を確認できます。
          </p>
        </div>
        <Link
          className="shrink-0 text-sm font-medium text-primary underline"
          href="/geo/data-catalog"
        >
          データカタログを見る →
        </Link>
      </SurfaceCard>

      <p className="mt-6 text-xs text-muted-foreground">
        各分析では47都道府県の結果だけでなく、入力、空間処理、検算、限界まで確認できます。{' '}
        <Link className="underline" href="/about">
          stats47について
        </Link>
      </p>
    </PageShell>
  );
}
