/**
 * ランキング一覧（索引ハブ）
 *
 * 注目ランキングと、17 カテゴリの索引 (件数付き) + 全ランキングの検索への入口。
 * 2026-10-28 に本文のカテゴリ節を撤去したが、390px ではサイドバーが Sheet に畳まれ本文から
 * カテゴリを探せなくなったため、同日に件数付きの索引 (RailCategoryList を本文の密度で流用) を戻した。
 *
 * 経緯: 2026-05-28 に旧索引（featured の薄い複製）を `/` へ 301 統合したが、
 * 2026-06-15 にカテゴリ網羅ブラウズのハブとして再設計・再設置した（home とは役割が異なる:
 * home = 注目ランキングの editorial 抜粋 / 本ページ = 全カテゴリの網羅索引）。
 * 2026-07-29 に 2 ペイン化。1440×900 のファーストビューに出るのがカテゴリ 3 件・
 * ランキング名 0 件だった（装飾画像 3:2 が 1 枚 260px を占め 1 行 3 カテゴリしか入らなかった）。
 * 装飾画像は `/category/[key]` のヘッダーが引き続き使う。
 *
 * 注目ランキングは home / category と同じ `FeaturedRankingCard` を使い、
 * R2 の `app/home/featured.json` に焼き込まれた地図・1位情報を表示する。
 * build 時の R2 到達可否でカードが欠落しないよう、この索引は request 時に描画する。
 */

import { RANKING_PROMINENCE_CATEGORIES } from '@stats47/data-configs/ranking-prominence';
import { Compass, LayoutGrid, TrendingUp } from 'lucide-react';

import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { PageSections } from '@/components/layout/PageShell';
import { RailCategoryList, RailStack } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { RailCard, RailNavRow, SectionCard } from '@/components/surface';
import { HorizontalCardCarouselFrame } from '@/components/surface/HorizontalCardCarousel';

import { FooterAdSlot } from '@/features/ads';
import { FeaturedRankings } from '@/features/ranking/featured.server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { KNOWN_RANKING_KEYS } from '@/config/known-ranking-keys';
import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import type { Metadata } from 'next';

const RANKING_COUNT = KNOWN_RANKING_KEYS.size;
/** カテゴリの数と件数は、サイドバーと同じビルド前の生成物から数える (本文と metadata で同じ値を使う) */
const CATEGORY_INDEX = RANKING_PROMINENCE_CATEGORIES.map((category) => ({
  categoryKey: category.categoryKey,
  categoryName: category.categoryName,
  count: category.count,
}));
const CATEGORY_COUNT = CATEGORY_INDEX.length;

export const dynamic = 'force-dynamic';

/** 右レールの「他の探し方」。カテゴリ一覧はサイドバー (AppSidebar) と本文の索引が持つので置かない。 */
const OTHER_ENTRY_POINTS = [
  { href: '/themes', label: 'テーマから探す' },
  { href: '/survey', label: '調査から探す' },
  { href: '/areas', label: '都道府県から探す' },
] as const;

export function generateMetadata(): Metadata {
  const title = `都道府県ランキング一覧｜全${CATEGORY_COUNT}カテゴリで47都道府県を比較`;
  const description = `人口・経済・教育・医療・治安まで全${CATEGORY_COUNT}カテゴリ、${RANKING_COUNT.toLocaleString()}件の統計ランキングで47都道府県を比較。気になるカテゴリからランキングを探せます。`;
  return {
    title,
    description,
    alternates: { canonical: '/ranking' },
    ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
  };
}

export default function RankingIndexPage() {
  const rightRail = (
    <RailStack>
      <RailCard title="他の探し方" icon={<Compass />}>
        <nav aria-label="他の探し方" className="flex flex-col divide-y divide-border">
          {OTHER_ENTRY_POINTS.map((entry) => (
            <RailNavRow key={entry.href} href={entry.href}>
              {entry.label}
            </RailNavRow>
          ))}
        </nav>
      </RailCard>
    </RailStack>
  );

  const header = (
    <>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: 'ランキング' }]}
      />
      {/*
        eyebrow と description は置かない。
        - eyebrow「ランキング」は直上のパンくず末尾と完全に同じ語で情報が増えない
          (他ハブは /themes「指標の横断比較」/survey「政府統計」のようにパンくずと別の語を足している)。
        - description は「カテゴリを選ぶとランキングが見られる」というページを見れば分かる説明にしかならず、
          その分だけ索引が fold の下へ押し出される。索引そのものが答えなので h1 と規模だけ出す。
      */}
      <PageHeader
        title="都道府県ランキング一覧"
        stats={`全 ${RANKING_COUNT.toLocaleString()} ランキング ・ ${CATEGORY_COUNT} カテゴリ ・ 47 都道府県`}
      />
    </>
  );

  return (
    <PageShell rightRail={rightRail} header={header}>
      {/* 節はカード同士を点線の帯で接ぐ (テンプレートの lyra のダッシュボード。home / category と同じ) */}
      <PageSections>
        <HorizontalCardCarouselFrame
          title="注目のランキング"
          icon={<TrendingUp />}
          action={<SectionIndexLink href="/search?type=ranking">もっと見る</SectionIndexLink>}
        >
          <FeaturedRankings
            limit={4}
            showHeader={false}
            embedded
            trackHomeEvents={false}
          />
        </HorizontalCardCarouselFrame>

        {/* カテゴリの索引。390px ではサイドバーが畳まれるので、本文からもカテゴリで探せるようにする。
            行は区切り線で並べ、罫線から文字までを 16px にする (行の上下 8px + 本文の上下 8px) */}
        <SectionCard
          title={`${CATEGORY_COUNT} カテゴリから探す`}
          icon={<LayoutGrid />}
          headingAs="h2"
          bodyClassName="@container py-2"
        >
          <RailCategoryList
            items={CATEGORY_INDEX}
            trackingSurface="ranking_category"
            moreLink={{
              href: '/search?type=ranking',
              label: `全 ${RANKING_COUNT.toLocaleString()} ランキングから検索する`,
              trackingLabel: 'category:all',
            }}
            // 列数は本文の幅 (@container) で決める: 48rem 以上で 2 列
            className="@md:[&>ul]:grid @md:[&>ul]:grid-cols-2 @md:[&>ul]:gap-x-6"
          />
        </SectionCard>
      </PageSections>

      {/*
          フッター広告は本文カラム (右ペイン) の中に置く。グリッドの外に出すと
          左レール分だけ記事内広告と左端がずれる。カードの格子の外 (下) に置く
          (広告が無効のときは何も描かないので、格子の帯が余らないようにするため)。
        */}
      <FooterAdSlot className="mt-4" />
    </PageShell>
  );
}
