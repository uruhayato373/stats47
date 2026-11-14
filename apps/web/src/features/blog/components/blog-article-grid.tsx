import type { ComponentProps } from 'react';

import { hrefFor } from '@stats47/data-configs/content/href';
import { normalizeUnitsInText } from "@stats47/data-configs/unit";

import { ArticleTeaserCard, CardGrid } from '@/components/surface';

import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import { formatCardDate } from '../utils';

import type { Article } from '../types';

interface BlogArticleGridProps {
  articles: Article[];
  /** 一覧が 1 列のとき index 件目の後に出す要素 (ブログ一覧のインフィード広告。CardGrid の insertAfter) */
  insertAfter?: ComponentProps<typeof CardGrid>['insertAfter'];
}

export function BlogArticleGrid({ articles, insertAfter }: BlogArticleGridProps) {
  if (articles.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        条件に一致する記事が見つかりませんでした
      </p>
    );
  }

  // 記事カードの格子 (列は本文の幅で 1 → 2 → 3 列。部品の台帳 card-grid)。2026-10-29 にテーマの記事欄と同じ部品へ寄せた
  return (
    <CardGrid insertAfter={insertAfter}>
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
            description={article.description ? normalizeUnitsInText(article.description) : undefined}
            meta={
              cardDate ? (
                <time dateTime={article.updatedAt ?? article.publishedAt ?? undefined}>更新 {cardDate}</time>
              ) : undefined
            }
            eager={index < 3}
          />
        );
      })}
    </CardGrid>
  );
}
