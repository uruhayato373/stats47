import { useId, type ReactNode } from 'react';

import { PanelGrid } from '@stats47/components';
import { Newspaper } from 'lucide-react';

import { ArticleTeaserCard, CardGrid } from '@/components/surface';

import { NavImpressionTracker } from '@/lib/analytics/components/NavImpressionTracker';
import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import type { ContentRecommendation } from '@stats47/data-configs/content/navigation';

interface RelatedArticlesProps {
  items: readonly Pick<ContentRecommendation, 'id' | 'key' | 'href' | 'title'>[];
  surface: 'area_blog' | 'ranking_blog' | 'theme_blog';
  children?: ReactNode;
}

/** 本文の関連記事はここで描く。表示形式を変えるときは計測の版も更新する。 */
export function RelatedArticles({ items, surface, children }: RelatedArticlesProps) {
  const id = useId();
  if (!items.length) return null;
  return (
    <PanelGrid as="section" id={id} aria-labelledby={`${id}-title`} data-card-variant="related-articles-large-v1">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-base leading-5.5 font-medium text-foreground">
        <Newspaper aria-hidden="true" className="size-4 text-muted-foreground" />
        関連記事
      </h2>
      <CardGrid>
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
