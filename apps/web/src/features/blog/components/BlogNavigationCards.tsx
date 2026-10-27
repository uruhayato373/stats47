import { Button, Input } from '@stats47/components';
import { Badge } from '@stats47/components/atoms/ui/badge';
import { hrefFor } from '@stats47/data-configs/content/href';
import { ArrowRight, Search, Tags } from 'lucide-react';

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
  popularArticles?: readonly BlogNavigationArticle[];
  categories?: readonly BlogNavigationCategory[];
  themes?: readonly BlogNavigationTheme[];
  prefectures?: readonly BlogNavigationPrefecture[];
  /**
   * - `rail`: 右レールのカード群 / `mobile`: 長いカードを折りたたむ版
   * - `toolbar`: ブログ一覧の記事の上に置く操作行 (記事検索 + 人気のタグ) だけを描く (BlogListToolbar)
   */
  variant?: 'rail' | 'mobile' | 'toolbar';
  /**
   * 記事検索と人気のタグをレールに出す (既定: 出す)。ブログ一覧は本文の一覧の上 (BlogListToolbar) に
   * 1 回だけ描くので false にする (狭い幅でレールが一覧の後ろへ積まれ、検索とタグが届かなくなるため)。
   */
  includeSearchAndTags?: boolean;
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

/** タグの Badge リンク。レールのカードと一覧の上の操作行で同じものを使う */
function PopularTagList({ tags }: { tags: readonly BlogNavigationTag[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
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
  );
}

/**
 * ブログ一覧の記事の上に置く操作行 (記事検索 + 人気のタグ)。どの幅でも 1 回だけ描く
 * (テンプレートの表の上の検索・絞り込みの行と同じ位置)。レールには同じものを重ねて描かない。
 * タグのクリックはレールにあった頃と同じ導線名 blog_sidebar で数える (計測の系列を切らないため)。
 */
export function BlogListToolbar({ tags }: { tags: readonly BlogNavigationTag[] }) {
  const popularTags = selectPopularBlogTags(tags);
  return (
    <div className="mb-4 flex flex-col gap-3">
      <form action="/search" method="get" role="search" className="flex max-w-md gap-2">
        <input type="hidden" name="type" value="blog" />
        <Input
          type="search"
          name="q"
          aria-label="ブログ記事を検索"
          placeholder="キーワードで記事を検索"
          className="min-w-0 flex-1 text-sm"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="検索する" className="shrink-0">
          <Search aria-hidden="true" />
        </Button>
      </form>
      {popularTags.length > 0 && (
        <nav aria-label="人気のタグ" className="flex flex-wrap items-center gap-2" {...navSurfaceProps('blog_sidebar')}>
          <PopularTagList tags={popularTags} />
          <Link
            href="/blog/tags"
            data-nav-label="tag:all"
            className="inline-flex min-h-7 items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            タグ一覧を見る
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </nav>
      )}
    </div>
  );
}

/** ブログのデータを、サイト共通の独立した右レールカードへ割り当てる。 */
export function BlogNavigationCards({
  tags,
  popularArticles = [],
  categories = [],
  themes = [],
  prefectures = [],
  variant = 'rail',
  includeSearchAndTags = true,
}: BlogNavigationCardsProps) {
  if (variant === 'toolbar') return <BlogListToolbar tags={tags} />;

  const isMobile = variant === 'mobile';
  const trackingSurface = isMobile ? 'blog_discovery_mobile' : 'blog_sidebar';
  const popularTags = selectPopularBlogTags(tags);

  return (
    <>
      {includeSearchAndTags && (
        <RailSearchCard
          title="記事検索"
          action="/search"
          placeholder="キーワードで検索"
          ariaLabel="ブログ記事を検索"
          hiddenFields={{ type: 'blog' }}
        />
      )}

      {/* タグは全幅で折り返す Badge にする。横スクロール・フェードは使わず、幅に関係なく同じ高さで並べる。
      クリックは共通の NavClickTracker が data-nav-surface / data-nav-label で数える。 */}
      {includeSearchAndTags && popularTags.length > 0 && (
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
          <PopularTagList tags={popularTags} />
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
