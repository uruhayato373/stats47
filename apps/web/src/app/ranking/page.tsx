/**
 * ランキング一覧（索引ハブ）
 *
 * 全 17 カテゴリ = 全ランキングの網羅ブラウズ入口。**カテゴリ名だけでなく実際の
 * ランキング名を出す**ことで、探している指標がここにあるかをその場で判断できるようにする。
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
import Link from 'next/link';

import { RANKING_PROMINENCE_CATEGORIES } from '@stats47/data-configs/ranking-prominence';
import { ChevronRight } from 'lucide-react';

import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { SectionHeader } from '@/components/section';

import { FooterAdSlot } from '@/features/ads';
import { PortalCategoryGrid } from '@/features/home-portal';
import { FeaturedRankings } from '@/features/ranking/featured.server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { KNOWN_RANKING_KEYS } from '@/config/known-ranking-keys';

import type { Metadata } from 'next';

const RANKING_COUNT = KNOWN_RANKING_KEYS.size;

export const dynamic = 'force-dynamic';

/** 左レール末尾の「他の探し方」。旧実装は独立セクションで 3 枚のカードだった。 */
const OTHER_ENTRY_POINTS = [
  { href: '/themes', label: 'テーマから探す' },
  { href: '/survey', label: '調査から探す' },
  { href: '/areas', label: '都道府県から探す' },
] as const;

export function generateMetadata(): Metadata {
  const title = '都道府県ランキング一覧｜全17カテゴリで47都道府県を比較';
  const description = `人口・経済・教育・医療・治安まで全17カテゴリ、${RANKING_COUNT.toLocaleString()}件超の統計ランキングで47都道府県を比較。気になるカテゴリからランキングを探せます。`;
  return {
    title,
    description,
    alternates: { canonical: '/ranking' },
    ...generateOGMetadata({ title, description, imageUrl: '/og-image.jpg' }),
  };
}

export default function RankingIndexPage() {
  const leftRail = (
    <aside className="lg:pr-1">
      <SectionHeader title="カテゴリ" />
      <PortalCategoryGrid variant="sidebar" />

      <div className="mt-6">
        <SectionHeader title="他の探し方" />
        <nav className="grid grid-cols-1 border-t border-border">
          {OTHER_ENTRY_POINTS.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="group flex min-h-10 items-center gap-2 border-b border-border px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span className="min-w-0 flex-1 group-hover:text-primary">
                {entry.label}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );

  return (
    <PageShell leftRail={leftRail}>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: 'ランキング' }]}
      />
      {/*
        eyebrow と description は置かない。
        - eyebrow「ランキング」は直上のパンくず末尾と完全に同じ語で情報が増えない
          (他ハブは /themes「ディスカバリー」/survey「政府統計」のようにパンくずと別の語を足している)。
        - description は「カテゴリを選ぶとランキングが見られる」というページを見れば分かる説明にしかならず、
          その分だけ索引が fold の下へ押し出される。索引そのものが答えなので h1 と規模だけ出す。
      */}
      <PageHeader
        title="都道府県ランキング一覧"
        stats={`全 ${RANKING_COUNT.toLocaleString()} ランキング ・ 17 カテゴリ ・ 47 都道府県`}
      />

      <div>
        <section className="mb-8">
          <SectionHeader title="注目のランキング" />
          <FeaturedRankings
            limit={4}
            showHeader={false}
            embedded
            trackHomeEvents={false}
          />
        </section>

        {/*
            記事内広告は置かない。注目ストリップと索引の間しか置き場が無く、そこは
            ファーストビュー内 (実測 1440x900 で 396px / 390x844 で 620px) で、
            InContentAdSlot の配置規約「ファーストビュー内には置かない」に反する。
            比較: /category の記事内枠は 390px 幅で 3108px と fold の遥か下にある。
            索引ハブ (/ranking /themes /survey /tag /blog) は末尾の Multiplex 1 枠に統一する。
          */}
        <section className="mb-12">
          {/* 件数は h1 直下の stats 行が出しているのでここでは繰り返さない */}
          <SectionHeader
            title="カテゴリ別のランキング"
            description="各カテゴリの代表的なランキングを抜粋しています。"
          />
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {RANKING_PROMINENCE_CATEGORIES.map((category) => (
              <div key={category.categoryKey}>
                <h3 className="mb-1 flex items-baseline gap-2 border-b border-border pb-1">
                  <Link
                    href={`/category/${category.categoryKey}`}
                    className="text-sm font-bold hover:text-primary"
                  >
                    {category.categoryName}
                  </Link>
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {category.count.toLocaleString()} 件
                  </span>
                </h3>
                <ul className="mb-1">
                  {category.representatives.map((representative) => (
                    <li
                      key={representative.rankingKey}
                      className="truncate text-[13px] leading-6"
                    >
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground"
                      >
                        ・
                      </span>
                      <Link
                        href={`/ranking/${representative.rankingKey}`}
                        className="hover:text-primary hover:underline"
                      >
                        {representative.readerLabel ?? representative.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/category/${category.categoryKey}`}
                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
                >
                  {category.categoryName}の全 {category.count.toLocaleString()}{' '}
                  件
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/*
            フッター広告は本文カラム (右ペイン) の中に置く。グリッドの外に出すと
            左レール分だけ記事内広告と左端がずれる。他のハブ面 (/category, /blog) は
            元から両枠が同一カラムにあり、/ranking だけが内側グリッドのせいで外れていた。
          */}
        <FooterAdSlot />
      </div>
    </PageShell>
  );
}
