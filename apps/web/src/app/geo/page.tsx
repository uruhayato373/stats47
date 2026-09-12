import Link from 'next/link';

import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';
import { ArrowRight, MapPin } from 'lucide-react';

import { ContentDisclosure } from '@/components/content';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { RailLinksCard } from '@/components/rail';
import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceLinkCard } from '@/components/surface';

import { GeoAnalysisCards } from '@/features/geo-analysis';

import { POPULATION_BASELINE_RANKING_PATH } from '@/config/geo-redirects';

import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '地域データ分析 | stats47',
  description:
    '人口と土地・災害・施設の地理データを重ね、地域の分布を調べます。分析ごとの対象年、地域、原典と計算の根拠を確認できます。',
  alternates: { canonical: '/geo' },
};

function CompareLink() {
  return (
    <SurfaceLinkCard
      href="/geo/compare"
      className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">あなたの県から調べる</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          人口・地価・洪水・駅を県別に比較
        </p>
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-primary"
        aria-hidden="true"
      />
    </SurfaceLinkCard>
  );
}

export default function GeoPage() {
  return (
    <PageShell
      rightRail={
        <aside aria-label="地域分析の関連情報" className="space-y-5">
          <div className="hidden xl:block">
            <CompareLink />
          </div>
          <RailLinksCard
            title="地域の背景を知る"
            items={[
              {
                id: 'population',
                label: '2050年の人口増減率ランキング',
                href: POPULATION_BASELINE_RANKING_PATH,
              },
              { id: 'areas', label: '都道府県データブック', href: '/areas' },
              { id: 'blog', label: '統計を読み解くブログ', href: '/blog' },
            ]}
          />
          <RailLinksCard
            title="分析方法・出典"
            items={[
              {
                id: 'method',
                label: '地図の読み方と分析の限界',
                href: '/geo/method',
              },
              {
                id: 'sources',
                label: '使用データ・年度・利用条件',
                href: '/geo/data-catalog',
              },
            ]}
          />
          <SurfaceCard>
            <h3 className="text-sm font-semibold">地域を詳しく調べるために</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              地図で気になる場所を見つけたら、県別の集計や一次資料も確認できます。推計や距離条件を踏まえて読み進めてください。
            </p>
            <Link
              href="/about"
              className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline"
            >
              stats47について
            </Link>
          </SurfaceCard>
        </aside>
      }
    >
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: '地域分析' }]}
      />
      <PageHeader
        title="地図で見る地域の変化"
        description="一つのGISで分布を知り、データを重ねて地域の変化を読む。"
      />
      <nav
        aria-label="地域データの調べ方"
        className="mb-6 grid gap-4 sm:grid-cols-2"
      >
        <SurfaceLinkCard href="/geo/layers">
          <h3 className="font-semibold">1. GISを探す</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            人口・住宅地価・駅を単体の地図で確認する →
          </p>
        </SurfaceLinkCard>
        <SurfaceLinkCard href="#geo-analyses-heading">
          <h3 className="font-semibold">2. データを重ねて読む</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            人口と地価・洪水・駅の関係を調べる →
          </p>
        </SurfaceLinkCard>
      </nav>
      <div className="mb-5 xl:hidden">
        <CompareLink />
      </div>
      <section aria-labelledby="geo-analyses-heading">
        <SectionHeader
          title={<span id="geo-analyses-heading">調べたい問いから選ぶ</span>}
          description={`${GEO_ANALYSES.length}つの分析・対象範囲は各分析で確認`}
        />
        <GeoAnalysisCards />
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          地図は東京都本土（島しょを除く）の表示例です。3枚とも同じ範囲で、各分析では47都道府県へ切り替えられます。人口メッシュは2020年・2050年推計。境界と駅名は位置の目印です。空白は人口・危険性・利便性の判定を示しません。
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          境界：国土交通省「国土数値情報（行政区域データ）」をもとに{' '}
          <a href="https://geoshape.ex.nii.ac.jp/" className="underline">
            NIIが加工
          </a>
          （2023年）。表示用に加工。{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            className="underline"
          >
            CC BY-SA 4.0
          </a>
          。 駅名・位置は
          <Link href="/geo/data-catalog" className="underline">
            分析の駅データ
          </Link>
          を使用。
        </p>
      </section>
      <ContentDisclosure
        title="はじめての地域分析：地図の読み進め方"
        className="mt-8"
      >
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          <li>
            <strong>問いと県を選ぶ。</strong>
            住宅地点、洪水、駅のうち、気になる分析の地図を開きます。
          </li>
          <li>
            <strong>人口と重ね合わせを比べる。</strong>
            同じ県でも、場所によって違う組み合わせを確認します。
          </li>
          <li>
            <strong>集計・条件・出典を読む。</strong>
            1kmメッシュによる近似や推計の限界を、地図と合わせて確かめます。
          </li>
        </ol>
        <Link
          href="/geo/method"
          className="mt-4 inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          詳しい分析方法を見る
        </Link>
      </ContentDisclosure>
    </PageShell>
  );
}
