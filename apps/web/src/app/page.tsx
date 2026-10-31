
import { fetchPrefectures } from '@stats47/area';
import { Lightbulb, MapPin, Newspaper, TrendingUp } from 'lucide-react';
import { Metadata } from 'next';

import { PageShell, PageHeader } from '@/components/layout';
import { PageSections } from '@/components/layout/PageShell';
import { RailStack } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { HorizontalCardCarousel, SectionCard } from '@/components/surface';
import { HorizontalCardCarouselFrame } from '@/components/surface/HorizontalCardCarousel';

import {
  NativeAffiliateRow,
  OperatorProfileCard,
  RailAdSlot,
} from '@/features/ads';
import {
  resolveAffiliateBannersByVertical,
} from '@/features/ads/server';
import { PrefectureNavigator } from '@/features/area-profile';
import { listLatestArticles } from '@/features/blog/server';
import { PortalBlogCard, PortalUseCaseGrid } from '@/features/home-portal';
import { FeaturedRankings } from '@/features/ranking/featured.server';

import { ADSENSE_DISPLAY_ENABLED, RAIL_RECT } from '@/lib/google-adsense';

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
  // limit 8 = 縦長 (sidebar-sticky 在庫) を描画側で除外しても 4 件残すための余裕
  const homeNativeBanners = await resolveAffiliateBannersByVertical(
    'economy',
    8
  ).catch(() => []);
  // サイト全体のカテゴリ一覧はサイドバー (AppSidebar) が持つので、ここでは重複させない。
  // 右レールは AdSense と運営者プロフィール (2026-10-30。旧: AdSense・PR・縦長バナーと広告だけが続き、プロフィールは本文の最後にあった。
  // 固定の PR (SidebarPromoBanner) はランキングの指標が労働のときだけ出る部品で、ここでは描かれていなかったので外した)
  const rightRail = (
    <RailStack>
      {ADSENSE_DISPLAY_ENABLED && <RailAdSlot slot={RAIL_RECT} />}
      <OperatorProfileCard />
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
            <FeaturedRankings limit={6} showHeader={false} embedded />
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
        </PageSections>

        {/* home 訪問者の検索意図は食品消費・家計が最多 (GSC 実測 46%) なので economy 軸で解決する。
            広告はカードの格子の外に置く (カードではないので格子に入れない) */}
        {homeNativeBanners.length > 0 && (
          <div className="mt-4">
            <NativeAffiliateRow
              banners={homeNativeBanners}
              position="home-native"
              trackingCategory="home"
            />
          </div>
        )}
      </PageShell>
    </div>
  );
}
