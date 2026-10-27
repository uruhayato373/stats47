
import { fetchPrefectures } from '@stats47/area';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@stats47/components';
import { CATEGORIES } from '@stats47/data-configs';
import { Newspaper } from 'lucide-react';

import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { RightRailWidgets } from '@/components/rail';
import { SectionHeader } from '@/components/section';

import { OperatorProfileCard } from '@/features/ads';
import { AffiliateAdSlot } from '@/features/ads/server';
import { BlogArticleGrid, BlogNavigationCards } from '@/features/blog/listing';
import { readBlogIndexPageFromR2 } from '@/features/blog/listing.server';
import { ALL_THEMES } from '@/features/theme-dashboard/listing.server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';
import { formatOgpTitle } from "@/lib/metadata/site-title";

import { DEFAULT_OGP_IMAGE_PATH, SITE_ORIGIN } from '@/config/site';

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

const BLOG_INDEX_TITLE = 'ブログ';
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
    title: formatOgpTitle(BLOG_INDEX_TITLE),
    description: BLOG_INDEX_DESCRIPTION,
    imageUrl: DEFAULT_OGP_IMAGE_PATH,
    url: `${SITE_ORIGIN}/blog`,
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
      rightRail={
        <RightRailWidgets
          topWidgets={
            // 探索導線と運営者プロフィール (E-E-A-T)。右レールが出ない幅では PageShell が
            // レールごと記事一覧の後ろへ積むので、記事一覧が先・補助が後ろの順になる。
            // 記事検索と人気のタグは本文の一覧の上 (BlogNavigationCards variant="toolbar") が持つので、ここでは出さない。
            <>
              <BlogNavigationCards
                includeSearchAndTags={false}
                tags={blogTags}
                popularArticles={popularArticles}
                categories={BLOG_DISCOVERY_CATEGORIES}
                themes={BLOG_DISCOVERY_THEMES}
                prefectures={BLOG_DISCOVERY_PREFECTURES}
              />
              <OperatorProfileCard />
            </>
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

      <SectionHeader
        title={currentPage > 1 ? `記事一覧 · ${currentPage}ページ目` : '新着記事'}
        icon={<Newspaper />}
      />
      {/* 記事検索と人気のタグは一覧の上に 1 回だけ置く (狭い幅でレールが一覧の後ろへ積まれても届く) */}
      <BlogNavigationCards variant="toolbar" tags={blogTags} />
      <BlogArticleGrid articles={articles} />

      {/* 一覧本文の広告は置かず、地域文脈の画像バナー 1 枠をレール末尾だけに置く。 */}
      {(hasPrevPage || hasNextPage) && (
        <Pagination className="mt-8" aria-label="ページネーション">
          <PaginationContent>
            {hasPrevPage && (
              <PaginationItem>
                <PaginationPrevious
                  href={currentPage === 2 ? '/blog' : `/blog?page=${currentPage - 1}`}
                  aria-label="前のページ"
                  text="前のページ"
                />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink href={currentPage === 1 ? '/blog' : `/blog?page=${currentPage}`} isActive>
                {currentPage}
              </PaginationLink>
            </PaginationItem>
            {hasNextPage && (
              <PaginationItem>
                <PaginationNext
                  href={`/blog?page=${currentPage + 1}`}
                  aria-label="次のページ"
                  text="次のページ"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </PageShell>
  );
}
