import Link from 'next/link';

import { BUSINESS_PLAN_M1_GEO_ANALYSES } from '@stats47/data-configs/business-plan';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceSection } from '@/components/surface';

import { GeoAnalysisTracker } from '@/features/geo-analysis';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GeoAI地域分析の方法・限界 | stats47',
  description:
    '人口メッシュ、地価地点、洪水ポリゴン、駅代表点をどう重ね、何を判定できないのかを分析別に説明します。',
  alternates: { canonical: '/geo/method' },
};

const crossAnalyses = BUSINESS_PLAN_M1_GEO_ANALYSES.filter(
  (analysis) => analysis.analysisKind === 'spatial-cross',
);

export default function GeoMethodPage() {
  return (
    <PageShell>
      <GeoAnalysisTracker
        analysisId="m1-geo-method"
        analysisSlug="method"
        geography="prefecture"
        dataVersion="2020-2050"
      />
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: '方法・限界' },
        ]}
      />
      <PageHeader
        eyebrow="空間分析の読み方"
        title="地図の答えと、答えられないことを分ける"
        description="地点がメッシュに入るか、メッシュの中心が浸水区域に入るか、駅まで直線800m以内か。分析ごとの判定方法と、その近似が結果に与える影響を説明します。"
        stats={`${crossAnalyses.length}空間分析 ・ 1kmメッシュ・地点・距離の判定`}
      />

      <SectionHeader
        title="今回使う3つの空間処理"
        description="同じ地図に見えても、問いごとに演算と近似条件が違います。"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {crossAnalyses.map((analysis) => (
          <SurfaceCard key={analysis.slug} className="p-5">
            <p className="text-xs font-semibold text-primary">
              {analysis.sourceLayers.map((layer) => layer.geometry).join(' × ')}
            </p>
            <h3 className="mt-2 font-bold">{analysis.title}</h3>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {analysis.spatialOperations.map((operation, index) => (
                <li key={operation}>
                  {index + 1}. {operation}
                </li>
              ))}
            </ol>
            <Link
              className="mt-4 inline-block text-sm font-medium text-primary underline"
              href={`/geo/${analysis.slug}`}
            >
              結果・出典・データ品質を見る →
            </Link>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceSection className="mt-6">
        <SectionHeader title="この分析だけでは判断できないこと" hideRule />
        <div className="mt-3 grid gap-5 md:grid-cols-3">
          {crossAnalyses.map((analysis) => (
            <div key={analysis.slug}>
              <h3 className="text-sm font-bold">{analysis.title}</h3>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {analysis.caveats.map((caveat) => (
                  <li key={caveat}>・{caveat}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SurfaceSection>

      <SurfaceSection className="mt-6">
        <SectionHeader title="再現可能性の契約" hideRule />
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>・入力データの名称、版、ライセンス、取得元を保存する</li>
          <li>・空間判定と集計は決定的コードで実行し、AIに計算させない</li>
          <li>・47都道府県のcoverageと欠損を検査し、欠損を0として扱わない</li>
          <li>・派生snapshotとSNS画像に入力SHAを記録する</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          <Link className="font-medium text-primary underline" href="/geo/compare">
            1県を4つの問いで比較する
          </Link>
          <Link className="font-medium text-primary underline" href="/geo/data-catalog">
            GISデータカタログを見る
          </Link>
        </div>
      </SurfaceSection>
    </PageShell>
  );
}
