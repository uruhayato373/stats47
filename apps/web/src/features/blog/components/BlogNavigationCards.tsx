import {
  RailDataDiscoveryCards,
  RailLinksCard,
  RailSearchCard,
} from '@/components/rail';

import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

export interface BlogNavigationTag {
  tagKey: string;
  articleCount: number;
}

export interface BlogNavigationArticle {
  slug: string;
  title: string;
}

export interface BlogNavigationCategory {
  categoryKey: string;
  categoryName: string;
}

export interface BlogNavigationTheme {
  themeKey: string;
  title: string;
}

export interface BlogNavigationPrefecture {
  prefCode: string;
  prefName: string;
}

interface BlogNavigationCardsProps {
  tags: readonly BlogNavigationTag[];
  popularArticles: readonly BlogNavigationArticle[];
  categories: readonly BlogNavigationCategory[];
  themes: readonly BlogNavigationTheme[];
  prefectures: readonly BlogNavigationPrefecture[];
  variant?: 'rail' | 'mobile';
}

const POPULAR_TAG_LIMIT = 10;

export function selectPopularBlogTags(
  tags: readonly BlogNavigationTag[]
): BlogNavigationTag[] {
  return [...tags]
    .sort(
      (a, b) =>
        b.articleCount - a.articleCount ||
        a.tagKey.localeCompare(b.tagKey, 'ja')
    )
    .slice(0, POPULAR_TAG_LIMIT);
}

/** ブログのデータを、サイト共通の独立した右レールカードへ割り当てる。 */
export function BlogNavigationCards({
  tags,
  popularArticles,
  categories,
  themes,
  prefectures,
  variant = 'rail',
}: BlogNavigationCardsProps) {
  const isMobile = variant === 'mobile';
  const trackingSurface = isMobile ? 'blog_discovery_mobile' : 'blog_sidebar';
  const popularTags = selectPopularBlogTags(tags);

  return (
    <>
      <RailSearchCard
        title="記事検索"
        action="/search"
        placeholder="キーワードで検索"
        ariaLabel="ブログ記事を検索"
        hiddenFields={{ type: 'blog' }}
      />

      <RailLinksCard
        title="人気のタグ"
        items={popularTags.map((tag) => ({
          id: tag.tagKey,
          label: tag.tagKey,
          href: `/tag/${tag.tagKey}`,
          count: tag.articleCount,
          ariaLabel: `「${tag.tagKey}」の記事を${tag.articleCount}件見る`,
          trackingLabel: `tag:${tag.tagKey}`,
        }))}
        moreLink={{
          href: '/blog/tags',
          label: 'タグ一覧を見る →',
          trackingLabel: 'tag:all',
        }}
        trackingSurface={trackingSurface}
        horizontalOnMobile={isMobile}
      />

      <RailLinksCard
        title="よく読まれている記事"
        items={popularArticles.map((article) => ({
          id: article.slug,
          label: article.title,
          href: `/blog/${article.slug}`,
          trackingLabel: `popular:${article.slug}`,
          thumbnail: {
            lightSrc: blogThumbnailUrl(article.slug, 'light'),
            darkSrc: blogThumbnailUrl(article.slug, 'dark'),
            alt: '',
          },
        }))}
        layout="ranked"
        trackingSurface={trackingSurface}
      />

      <RailDataDiscoveryCards
        categories={categories}
        themes={themes}
        prefectures={prefectures}
        trackingSurface={trackingSurface}
        collapsible={isMobile}
      />
    </>
  );
}
