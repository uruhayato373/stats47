import { useId, type ReactNode } from 'react';

import { PanelGrid } from '@stats47/components';
import { Newspaper } from 'lucide-react';

import { ArticleTeaserCard, CardGrid } from '@/components/surface';

import { NavImpressionTracker } from '@/lib/analytics/components/NavImpressionTracker';
import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import type { ContentRecommendation } from '@stats47/data-configs/content/navigation';

interface RelatedArticlesProps {
  items: readonly Pick<ContentRecommendation, 'id' | 'key' | 'href' | 'title'>[];
  /** 市区町村のページは従来の値 municipality_related のまま (2026-11-13 にこの部品へ移した。計測の値を変えない) */
  surface: 'area_blog' | 'ranking_blog' | 'theme_blog' | 'municipality_related';
  children?: ReactNode;
  /** index 件目の後に、記事の格子が 1 列のときだけ出す要素 (県のページのインフィード広告。CardGrid の insertAfter) */
  insertAfter?: { index: number; node: ReactNode };
}

/** 本文の関連記事はここで描く。表示形式を変えるときは計測の版も更新する。 */
export function RelatedArticles({ items, surface, children, insertAfter }: RelatedArticlesProps) {
  const id = useId();
  if (!items.length) return null;
  return (
    <PanelGrid as="section" id={id} aria-labelledby={`${id}-title`} data-card-variant="related-articles-large-v1">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-base leading-5.5 font-medium text-foreground">
        <Newspaper aria-hidden="true" className="size-4 text-muted-foreground" />
        関連記事
      </h2>
      <CardGrid insertAfter={insertAfter}>
        {items.map((item) => (
          <ArticleTeaserCard
            key={item.id}
            contentId={item.id}
            href={item.href}
            title={item.title}
            thumbnail={{ lightSrc: blogThumbnailUrl(item.key, 'light'), darkSrc: blogThumbnailUrl(item.key, 'dark') }}
            navSurface={surface}
          />
        ))}
      </CardGrid>
      {children}
      <NavImpressionTracker containerId={id} />
    </PanelGrid>
  );
}
