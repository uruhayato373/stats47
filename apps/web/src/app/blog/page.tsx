import Link from 'next/link';

import { fetchPrefectures } from '@stats47/area';
import { CATEGORIES } from '@stats47/data-configs';

import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { RightRailWidgets } from '@/components/rail';

import { OperatorProfileCard } from '@/features/ads';
import { AffiliateAdSlot } from '@/features/ads/server';
import { BlogArticleGrid, BlogNavigationCards } from '@/features/blog/listing';
import { readBlogIndexPageFromR2 } from '@/features/blog/listing.server';
import { ALL_THEMES } from '@/features/theme-dashboard/listing.server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import type { Metadata } from 'next';

export const revalidate = 86400;

const PAGE_SIZE = 24;
const BLOG_DISCOVERY_CATEGORIES = CATEGORIES.slice(0, 6).map((category) => ({
  categoryKey: category.categoryKey,
  categoryName: category.categoryName,
}));
const BLOG_DISCOVERY_THEMES = ALL_THEMES.slice(0, 6).map((theme) => ({
  themeKey: theme.themeKey,
  title: theme.title,
}));
const BLOG_DISCOVERY_PREFECTURES = fetchPrefectures();

const BLOG_INDEX_TITLE = 'ブログ | stats47';
const BLOG_INDEX_DESCRIPTION =
  '都道府県の統計データを分析した記事一覧。人口、経済、教育、福祉などのランキングや時系列分析を掲載。';

export const metadata: Metadata = {
  title: BLOG_INDEX_TITLE,
  description: BLOG_INDEX_DESCRIPTION,
  alternates: {
    canonical: '/blog',
  },
  // per-page R2 OGP を持たない一覧ページは静的 /og-image.jpg を明示する。
  // 未指定だと Next が root の opengraph-image.tsx (ランタイム next/og) を自動注入し、
  // Cloudflare Worker で 500 になる (正典: .claude/rules/ogp-image-standards.md §3 課題0)。
  ...generateOGMetadata({
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
    imageUrl: '/og-image.jpg',
    url: 'https://stats47.jp/blog',
  }),
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  // 記事・meta・次ページ判定を snapshot 1 回読みでまとめて取る。
  // 個別 reader を並べると同一リクエスト内で full snapshot を 3 回取得していた。
  const indexPage = await readBlogIndexPageFromR2(PAGE_SIZE, offset).catch(
    () => null
  );
  const articles = indexPage?.articles ?? [];
  const popularArticles = (indexPage?.popularArticles ?? []).map((article) => ({
    slug: article.slug,
    title: article.title,
  }));
  const meta = indexPage?.meta ?? null;
  const hasNextPage = indexPage?.hasNextPage ?? false;
  const hasPrevPage = currentPage > 1;
  const blogTags = meta?.tagMeta ?? [];

  return (
    // doboku-note スタイル: 左=記事カード一覧 / 右=共通サイドバー (運営者プロフィール + promo/広告)。
    // 運営者は上部の共通 OperatorProfileCard が担う。
    <PageShell
      rightRailBreakpoint="lg"
      rightRail={
        <RightRailWidgets
          topWidgets={
            // 探索導線と運営者プロフィール (E-E-A-T) は右レールに PC のみ表示
            <div className="hidden lg:flex lg:flex-col lg:gap-3">
              <BlogNavigationCards
                tags={blogTags}
                popularArticles={popularArticles}
                categories={BLOG_DISCOVERY_CATEGORIES}
                themes={BLOG_DISCOVERY_THEMES}
                prefectures={BLOG_DISCOVERY_PREFECTURES}
              />
              <OperatorProfileCard />
            </div>
          }
          bottomWidgets={
            <AffiliateAdSlot
              categoryKey="administrativefinancial"
              vertical="furusato"
              position="sidebar"
              bannerOnly
              bannerLimit={1}
              trackingPosition="blog-sidebar"
            />
          }
          showPromoBanner={false}
          showTopAd={false}
          showBottomAd={false}
        />
      }
    >
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: 'ブログ' }]}
      />

      <PageHeader
        title="統計ブログ"
        description="都道府県データを、ランキングや時系列で読み解く記事一覧です"
      />

      {/* 右レールが本文後へ回る狭幅では、探索導線を記事一覧の前に置く。 */}
      <div className="mb-6 lg:hidden">
        <div className="space-y-3">
          <BlogNavigationCards
            tags={blogTags}
            popularArticles={popularArticles}
            categories={BLOG_DISCOVERY_CATEGORIES}
            themes={BLOG_DISCOVERY_THEMES}
            prefectures={BLOG_DISCOVERY_PREFECTURES}
            variant="mobile"
          />
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {currentPage > 1 ? `記事一覧 · ${currentPage}ページ目` : '新着記事'}
      </p>
      <BlogArticleGrid articles={articles} />

      {/* 一覧本文の広告は置かず、地域文脈の画像バナー 1 枠をレール末尾だけに置く。 */}
      {/* ページネーション */}
      {(hasPrevPage || hasNextPage) && (
        <nav
          className="mt-8 flex items-center justify-center gap-3"
          aria-label="ページネーション"
        >
          {hasPrevPage ? (
            <Link
              href={
                currentPage === 2 ? '/blog' : `/blog?page=${currentPage - 1}`
              }
              className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              ← 前のページ
            </Link>
          ) : (
            <span
              className="rounded-none border border-border px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
              aria-disabled="true"
            >
              ← 前のページ
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {currentPage} ページ
          </span>
          {hasNextPage ? (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              次のページ →
            </Link>
          ) : (
            <span className="rounded-none border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
              次のページ →
            </span>
          )}
        </nav>
      )}
    </PageShell>
  );
}
