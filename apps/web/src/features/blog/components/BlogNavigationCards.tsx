import { Badge } from '@stats47/components/atoms/ui/badge';
import { hrefFor } from '@stats47/data-configs/content/href';
import { ArrowRight, Tags } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import {
  RailDataDiscoveryCards,
  RailLinksCard,
  RailSearchCard,
} from '@/components/rail';
import { RailCard } from '@/components/surface';

import { navSurfaceProps } from '@/lib/analytics/events';
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

      {/* タグは全幅で折り返す Badge にする。横スクロール・フェードは使わず、幅に関係なく同じ高さで並べる。
      クリックは共通の NavClickTracker が data-nav-surface / data-nav-label で数える。 */}
      {popularTags.length > 0 && (
        <RailCard
          title="人気のタグ"
          aria-label="人気のタグ"
          icon={<Tags />}
          headerAction={
            <Link
              href="/blog/tags"
              data-nav-label="tag:all"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              タグ一覧を見る
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          }
          {...navSurfaceProps(trackingSurface)}
        >
          <ul className="flex flex-wrap gap-1.5">
            {popularTags.map((tag) => (
              <li key={tag.tagKey}>
                <Badge
                  variant="outline"
                  className="h-7 gap-1 px-2.5"
                  render={
                    <Link
                      href={hrefFor('tag', { tagKey: tag.tagKey })}
                      aria-label={`「${tag.tagKey}」の記事を${tag.articleCount}件見る`}
                      data-nav-label={`tag:${tag.tagKey}`}
                    />
                  }
                >
                  {tag.tagKey}
                  <span className="tabular-nums text-muted-foreground">
                    {tag.articleCount}
                  </span>
                </Badge>
              </li>
            ))}
          </ul>
        </RailCard>
      )}

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
