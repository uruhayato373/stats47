import Link from 'next/link';

import { fetchPrefectures } from '@stats47/area';
import { Metadata } from 'next';

import { PageShell, PageHeader } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { HorizontalCardCarousel } from '@/components/surface';

import {
  NativeAffiliateRow,
  OperatorProfileCard,
  RailAdSlot,
  SidebarPromoBanner,
} from '@/features/ads';
import {
  resolveAffiliateBannersByVertical,
  SidebarStickyBannerAd,
} from '@/features/ads/server';
import { PrefectureNavigator } from '@/features/area-profile';
import { listLatestArticles } from '@/features/blog/server';
import {
  PortalBlogCard,
  PortalCategoryGrid,
  PortalUseCaseGrid,
} from '@/features/home-portal';
import { FeaturedRankings } from '@/features/ranking/featured.server';

import { ADSENSE_DISPLAY_ENABLED, RAIL_RECT } from '@/lib/google-adsense';

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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stats47.jp';

  const title = {
    absolute: '統計で見る都道府県 | 47都道府県ランキング・データ比較',
  };
  const description =
    'あなたの県は何位？年収・人口・消費量から教育・医療まで、1,800以上の統計で47都道府県をランキング。地図やグラフで地域の特徴をわかりやすく可視化します。';

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
      siteName: 'Stats47',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: '統計で見る都道府県 - 47都道府県ランキング',
        },
      ],
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
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
  const leftRail = (
    <aside className="lg:pr-1">
      <SectionHeader
        title="カテゴリから探す"
        action={
          <Link
            href="/ranking"
            className="font-semibold text-primary hover:underline"
          >
            一覧 →
          </Link>
        }
      />
      <PortalCategoryGrid variant="sidebar" />
      {ADSENSE_DISPLAY_ENABLED && (
        <div className="mt-6">
          <RailAdSlot slot={RAIL_RECT} />
        </div>
      )}
      <div className="mt-4">
        <SidebarPromoBanner index={0} />
      </div>
      <div className="mt-4">
        <SidebarStickyBannerAd position="home-left-rail" />
      </div>
    </aside>
  );

  return (
    <div className="w-full">
      <PageShell leftRail={leftRail} className="py-5 lg:py-6">
        <PageHeader
          title="日本の地域データを探す"
          description="47都道府県のランキング、人口・年収・暮らしの統計を検索できます。"
          className="mb-4"
        />

        <div className="space-y-6">
          <section>
            <SectionHeader
              title="注目のランキング"
              action={
                <Link
                  href="/ranking"
                  className="font-semibold text-primary hover:underline"
                >
                  もっと見る →
                </Link>
              }
            />
            <FeaturedRankings limit={6} showHeader={false} embedded />
          </section>

          {latestArticles.length > 0 && (
            <section>
              <SectionHeader
                title="新着ブログ"
                action={
                  <Link
                    href="/blog"
                    className="font-semibold text-primary hover:underline"
                  >
                    すべての記事 →
                  </Link>
                }
              />
              <HorizontalCardCarousel ariaLabel="新着ブログ">
                {latestArticles.map((article) => (
                  <PortalBlogCard
                    key={article.slug}
                    slug={article.slug}
                    title={article.title}
                  />
                ))}
              </HorizontalCardCarousel>
            </section>
          )}

          <section>
            <SectionHeader
              title="知りたいことから探す"
              action={
                <Link
                  href="/themes"
                  className="font-semibold text-primary hover:underline"
                >
                  すべてのテーマ →
                </Link>
              }
            />
            <PortalUseCaseGrid />
          </section>

          <section>
            <SectionHeader
              title="都道府県から探す"
              action={
                <Link
                  href="/areas"
                  className="font-semibold text-primary hover:underline"
                >
                  一覧 →
                </Link>
              }
            />
            <PrefectureNavigator
              prefectures={prefectures}
              variant="embedded"
              surface="home"
            />
          </section>

          <section>
            <SectionHeader
              title="運営者プロフィール"
              action={
                <Link
                  href="/about"
                  className="font-semibold text-primary hover:underline"
                >
                  詳しく見る →
                </Link>
              }
            />
            <OperatorProfileCard className="overflow-hidden" />
          </section>

          {/* home 訪問者の検索意図は食品消費・家計が最多 (GSC 実測 46%) なので economy 軸で解決する。 */}
          {homeNativeBanners.length > 0 && (
            <NativeAffiliateRow
              banners={homeNativeBanners}
              position="home-native"
              trackingCategory="home"
            />
          )}
        </div>
      </PageShell>
    </div>
  );
}
