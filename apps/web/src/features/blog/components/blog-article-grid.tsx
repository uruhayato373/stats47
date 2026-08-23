import { ArrowRight } from 'lucide-react';

import { ThemeAwareImage } from '@/components/atoms/ThemeAwareImage';
import { SurfaceLinkCard } from '@/components/surface/SurfaceCard';

import {
  BLOG_THUMBNAIL_ASPECT_CLASS,
  blogThumbnailUrl,
} from '@/lib/metadata/ogp-image';

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

  return (
    // 右レール有無で本文カラム幅が変動するため、列数はビューポートでなく
    // コンテナクエリで決める (ui-components.md のカードグリッド規約)。
    // @container は祖先要素にしか効かないため wrapper で包む
    <div className="@container">
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @md:grid-cols-3">
        {articles.map((article, index) => {
          const cardDate = formatCardDate(
            article.updatedAt ?? article.publishedAt
          );
          return (
            <SurfaceLinkCard
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group flex min-h-80 flex-col overflow-hidden p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className={`relative ${BLOG_THUMBNAIL_ASPECT_CLASS} w-full overflow-hidden border-b border-border bg-muted`}
              >
                <ThemeAwareImage
                  lightSrc={blogThumbnailUrl(article.slug, 'light')}
                  darkSrc={blogThumbnailUrl(article.slug, 'dark')}
                  alt=""
                  fill
                  loading={index < 3 ? 'eager' : 'lazy'}
                  sizes="(min-width: 1280px) 272px, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>都道府県データ</span>
                  {article.hasCharts && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>グラフあり</span>
                    </>
                  )}
                </div>

                <h2 className="line-clamp-3 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                  {article.title}
                </h2>

                {article.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {article.description}
                  </p>
                )}

                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  {cardDate ? (
                    <time
                      dateTime={
                        article.updatedAt ?? article.publishedAt ?? undefined
                      }
                      className="text-xs text-muted-foreground"
                    >
                      更新 {cardDate}
                    </time>
                  ) : (
                    <span />
                  )}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                  />
                </div>
              </div>
            </SurfaceLinkCard>
          );
        })}
      </div>
    </div>
  );
}
