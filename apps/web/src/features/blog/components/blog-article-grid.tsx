import { hrefFor } from '@stats47/data-configs/content/href';
import { normalizePercentInText } from "@stats47/data-configs/unit";

import { ArticleTeaserCard, ArticleTeaserGrid } from '@/components/surface';

import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import type { Article } from '../types';

/** ISO 文字列を YYYY.MM.DD へ整形。無効値は null。 */
function formatCardDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

interface BlogArticleGridProps {
  articles: Article[];
}

export function BlogArticleGrid({ articles }: BlogArticleGridProps) {
  if (articles.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        条件に一致する記事が見つかりませんでした
      </p>
    );
  }

  // 記事カードの格子 (列は本文の幅で 1 → 2 → 3 列。部品の台帳 article-teaser-grid)。2026-10-29 にテーマの記事欄と同じ部品へ寄せた
  return (
    <ArticleTeaserGrid>
      {articles.map((article, index) => {
        const cardDate = formatCardDate(article.updatedAt ?? article.publishedAt);
        return (
          <ArticleTeaserCard
            key={article.slug}
            href={hrefFor('blog', { slug: article.slug })}
            title={article.title}
            thumbnail={{
              lightSrc: blogThumbnailUrl(article.slug, 'light'),
              darkSrc: blogThumbnailUrl(article.slug, 'dark'),
            }}
            description={article.description ? normalizePercentInText(article.description) : undefined}
            meta={
              cardDate ? (
                <time dateTime={article.updatedAt ?? article.publishedAt ?? undefined}>更新 {cardDate}</time>
              ) : undefined
            }
            eager={index < 3}
          />
        );
      })}
    </ArticleTeaserGrid>
  );
}
