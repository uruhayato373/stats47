
import { GEO_ANALYSES } from '@stats47/data-configs/business-plan';
import { ArrowRight, MapPin } from 'lucide-react';

import { ExternalAnchor } from "@/components/atoms/ExternalAnchor";
import Link from '@/components/atoms/SiteLink';
import { ContentDisclosure } from '@/components/content';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';
import { RailLinksCard } from '@/components/rail';
import { SectionHeader } from '@/components/section';
import { SurfaceLinkCard } from '@/components/surface';

import {
  GeoAnalysisCards,
  GEO_HOME_LAYER_NAV_ITEMS,
} from '@/features/geo-analysis';

import { POPULATION_BASELINE_RANKING_PATH } from '@/config/geo-redirects';

import type { Metadata } from 'next';

// 分析カードの地図プレビューは R2 の県別 bundle を読む。build 環境は R2 を読めないため、
// 静的 prerender だと 6 枚とも「地図プレビューを取得できませんでした」が焼き込まれる
// (2026-09-23 本番で確認)。home `/` と同じくランタイム描画にする。
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '地域データ分析',
  description:
    '人口と土地・災害・施設の地理データを重ね、地域の分布を調べます。分析ごとの対象年、地域、原典と計算の根拠を確認できます。',
  alternates: { canonical: '/geo' },
};

const GEO_METHOD_LINKS = [
  {
    id: 'method',
    label: '地図の読み方・限界',
    href: '/geo/method',
  },
  {
    id: 'sources',
    label: '使用データと利用条件',
    href: '/geo/data-catalog',
  },
] as const;

/** 県比較の入口。文言は幅で変えず 1 種類にする。 */
function CompareLink() {
  return (
    <SurfaceLinkCard
      href="/geo/compare"
      className="flex items-center gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
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
    // ページ内ナビのために 2 本目の列 (左レール) を作らない。県比較の入口は本文の先頭、
    // GIS 一覧と方法・出典は本文末のカードにする (どの幅でも同じ並び)。
    // 「分析を選ぶ」のリンク一覧は、本文の分析カードと同じ内容なので置かない。
    <PageShell>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: '地域分析' }]}
      />
      <PageHeader
        title="地図で見る地域の変化"
        description="一つのGISで分布を知り、データを重ねて地域の変化を読む。"
      />
      <div className="mb-5">
        <CompareLink />
      </div>
      <section aria-labelledby="geo-analyses-heading">
        <SectionHeader
          title={<span id="geo-analyses-heading">調べたい問いから選ぶ</span>}
          description={`${GEO_ANALYSES.length}つの分析・対象範囲は各分析で確認`}
        />
        {/* 注記は地図付きのカードの直下に置き、地図の無い分析の節 (GeoAnalysisCards 内の小見出し) より前に出す */}
        <GeoAnalysisCards
          previewFootnote={
            <>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                地図は兵庫県（淡路島を含む）の表示例です。3枚とも同じ範囲で、各分析では47都道府県へ切り替えられます。人口メッシュは2020年・2050年推計。境界と駅名は位置の目印です（重なる駅名は一部を省いています）。空白は人口・危険性・利便性の判定を示しません。
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                境界：国土交通省「国土数値情報（行政区域データ）」をもとに{' '}
                <ExternalAnchor href="https://geoshape.ex.nii.ac.jp/" className="underline">
                  NIIが加工
                </ExternalAnchor>
                （2023年）。表示用に加工。{' '}
                <ExternalAnchor
                  href="https://creativecommons.org/licenses/by-sa/4.0/"
                  className="underline"
                >
                  CC BY-SA 4.0
                </ExternalAnchor>
                。
                駅名・位置は分析の駅データ（「使用データ・年度・利用条件」に記載）を使用。
              </p>
            </>
          }
        />
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
      </ContentDisclosure>
      <section
        aria-labelledby="geo-related-heading"
        className="mt-8 border-t pt-6"
      >
        <SectionHeader
          title={<span id="geo-related-heading">関連する地域データ</span>}
        />
        <nav
          aria-label="関連する地域データ"
          className="flex flex-wrap gap-x-6 gap-y-1"
        >
          <Link
            href={POPULATION_BASELINE_RANKING_PATH}
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            2050年の人口増減率ランキング
          </Link>
          <Link
            href="/areas"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            都道府県データブック
          </Link>
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            統計を読み解くブログ
          </Link>
        </nav>
      </section>
      <PanelGrid className="mt-6 @min-[656px]/shell:grid-cols-2">
          <RailLinksCard
            title="GIS一覧"
            layout="list"
            trackingSurface="geo_sidebar"
            items={GEO_HOME_LAYER_NAV_ITEMS}
            moreLink={{ href: '/geo/layers', label: 'すべてのGISを探す →' }}
          />
          <RailLinksCard
            title="方法・出典"
            layout="list"
            trackingSurface="geo_sidebar"
            items={GEO_METHOD_LINKS}
          />
      </PanelGrid>
    </PageShell>
  );
}
