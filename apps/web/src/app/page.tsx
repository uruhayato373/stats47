
import { fetchPrefectures } from '@stats47/area';
import { hrefFor } from '@stats47/data-configs/content/href';
import { Lightbulb, MapPin, Newspaper, TrendingUp } from 'lucide-react';
import { Metadata } from 'next';


import { PageShell, PageHeader } from '@/components/layout';
import { PageSections } from '@/components/layout/PageShell';
import { RailLinksCard, RailStack } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { HorizontalCardCarousel, SectionCard } from '@/components/surface';
import { HorizontalCardCarouselFrame } from '@/components/surface/HorizontalCardCarousel';

import {
  AdRow,
  composeAdRows,
  OperatorProfileCard,
  RailAdSlot,
} from '@/features/ads';
import { PrefectureNavigator } from '@/features/area-profile';
import { listLatestArticles, readPopularArticlesFromR2 } from '@/features/blog/server';
import { PortalBlogCard, PortalUseCaseGrid } from '@/features/home-portal';
import { FeaturedRankings } from '@/features/ranking/featured.server';

import { ADSENSE_DISPLAY_ENABLED, HOME_RAIL_STICKY, HOME_ROW_1, HOME_ROW_2, RAIL_RECT } from '@/lib/google-adsense';
import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import { DEFAULT_OGP_IMAGE_PATH, SITE_ALTERNATE_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '@/config/site';

/**
 * 動的レンダリング（ランタイム SSR）を強制する。
 *
 * このページは `<FeaturedRankings>`（注目のランキング）と `listLatestArticles`（最新記事）を
 * R2 snapshot から読む。**ビルド環境では R2 が読めない**ため、純 SSG だと空を焼き込み再デプロイまで
 * 配信され続ける回帰が起きる。`force-dynamic` で毎リクエスト Cloudflare Workers ランタイムに描画させ、
 * R2 バインディングで featured.json / 記事を取得する（詳細な経緯は git 履歴参照）。
 */
export const dynamic = 'force-dynamic';

/**
 * ホームページ（ポータル型・2026-07-23 再設計）
 *
 * 設計思想（正典: src/features/home-portal/README.md）:
 * - 暗色ヒーローと重複検索を撤去し、白基調の「h1 + 短い説明」から開始する。
 * - desktop は左カテゴリ / 右ランキング・ブログの2ペインで、初期画面の情報量を確保する。
 * - 各セクションは代表項目 + 「もっと見る」に抑え、home へ全件を詰めない。
 */
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || SITE_ORIGIN;

  const title = {
    absolute: `${SITE_NAME} | 47都道府県ランキング・データ比較`,
  };
  const description = SITE_DESCRIPTION;

  return {
    title,
    description,
    keywords: [
      '統計',
      '都道府県',
      'ランキング',
      '地域の特徴',
      'データ可視化',
      '人口統計',
      '経済統計',
      '政府統計',
      'e-Stat',
      '日本',
      '47都道府県',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: baseUrl,
      siteName: SITE_ALTERNATE_NAME,
      images: [
        {
          url: new URL(DEFAULT_OGP_IMAGE_PATH, baseUrl).href,
          width: 1200,
          height: 630,
          alt: 'stats47 - 日本の地域データを探す・比べる・分析する',
        },
      ],
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [new URL(DEFAULT_OGP_IMAGE_PATH, baseUrl).href],
    },
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function HomePage() {
  const latestArticles = await listLatestArticles(8).catch(() => []);
  const prefectures = fetchPrefectures();
  // 広告の段 (2026-11-12 オーナー決定): アフィリエイトを止め、用途から探す節の後とページの最後に AdSense 1 つを本文の幅いっぱい
  // (上限 580px) に出す。ユニットはホーム専用 (同日に作成。それまでは一覧ページと共用で、ホームの分を測れなかった)。
  // 右レールの AdSense (RAIL_RECT) とは別のユニット
  const [homeRow1, homeRow2] = composeAdRows([['adsense'], ['adsense']], [HOME_ROW_1, HOME_ROW_2], []);
  // よく読まれている記事 (GA4 の直近 28 日の閲覧数・週次。ブログの右レールと同じ台帳)。本文の新着の記事の一覧に出した記事は除く
  const popularArticles = (await readPopularArticlesFromR2('', 13).catch(() => []))
    .filter((article) => !latestArticles.some((latest) => latest.slug === article.slug))
    .slice(0, 5);
  // サイト全体のカテゴリ一覧はサイドバー (AppSidebar) が持つので、ここでは重複させない。
  // 右レール (2026-11-12 オーナー決定・推奨案): PC で中身が約 500px しかなく本文 (約 2,800px) の下が約 2,200px 空いていたので、
  // ブログの右レールと同じく「よく読まれている記事」と、最後に追従する 300×600 を足した。上の AdSense と追従する枠の間には
  // 記事の一覧と運営者のプロフィールが入る (広告の枠の台帳の noAdjacentSlots)。追従する枠は PC だけ (RailAdSlot の sticky)
  const rightRail = (
    <RailStack className="rail:h-full">
      {ADSENSE_DISPLAY_ENABLED && <RailAdSlot slot={RAIL_RECT} />}
      <RailLinksCard
        title="よく読まれている記事"
        items={popularArticles.map((article) => ({
          id: article.slug,
          label: article.title,
          href: hrefFor('blog', { slug: article.slug }),
          trackingLabel: `popular:${article.slug}`,
          thumbnail: {
            lightSrc: blogThumbnailUrl(article.slug, 'light'),
            darkSrc: blogThumbnailUrl(article.slug, 'dark'),
            alt: '',
          },
        }))}
        layout="ranked"
        trackingSurface="home_blog"
      />
      <OperatorProfileCard />
      {ADSENSE_DISPLAY_ENABLED && <RailAdSlot slot={HOME_RAIL_STICKY} sticky />}
    </RailStack>
  );

  // パンくずの無いトップでは、h1 の上の小ラベルでサイトの役割を示す
  const header = (
    <PageHeader
      eyebrow="地域のデータアトラス"
      title="日本の地域データを探す"
      description="47都道府県のランキング、人口・年収・暮らしの統計を検索できます。"
    />
  );

  return (
    <div className="w-full">
      <PageShell rightRail={rightRail} header={header}>
        {/* 節はカードの見出しに題名を置き、カード同士を点線の帯で接ぐ (テンプレートの lyra のダッシュボード)。
            カード列は区切り線のセルにする (テンプレートの KPI 行) */}
        <PageSections>
          <HorizontalCardCarouselFrame
            title="注目のランキング"
            icon={<TrendingUp />}
            action={
              <SectionIndexLink href="/ranking">もっと見る</SectionIndexLink>
            }
          >
            <FeaturedRankings limit={6} />
          </HorizontalCardCarouselFrame>

          {latestArticles.length > 0 && (
            <HorizontalCardCarouselFrame
              title="新着ブログ"
              icon={<Newspaper />}
              action={
                <SectionIndexLink href="/blog">すべての記事</SectionIndexLink>
              }
            >
              <HorizontalCardCarousel ariaLabel="新着ブログ">
                {latestArticles.map((article) => (
                  <PortalBlogCard
                    key={article.slug}
                    slug={article.slug}
                    title={article.title}
                  />
                ))}
              </HorizontalCardCarousel>
            </HorizontalCardCarouselFrame>
          )}

          <HorizontalCardCarouselFrame
            title="知りたいことから探す"
            icon={<Lightbulb />}
            action={
              <SectionIndexLink href="/themes">すべてのテーマ</SectionIndexLink>
            }
          >
            <PortalUseCaseGrid />
          </HorizontalCardCarouselFrame>

          {/* 広告の段 1 つ目 (用途から探す節の後) */}
          {homeRow1.length > 0 && (
            <section>
              <AdRow cells={homeRow1} position="home-row-1" trackingCategory="home" wide />
            </section>
          )}

          <SectionCard
            title="都道府県から探す"
            icon={<MapPin />}
            headingAs="h2"
            headerAction={<SectionIndexLink href="/areas" label="都道府県の一覧へ" />}
          >
            <PrefectureNavigator
              prefectures={prefectures}
              variant="embedded"
              surface="home"
            />
          </SectionCard>

          {homeRow2.length > 0 && (
            <section>
              <AdRow cells={homeRow2} position="home-row-2" trackingCategory="home" wide />
            </section>
          )}
        </PageSections>

      </PageShell>
    </div>
  );
}
