import { PanelGrid } from '@stats47/components';
import { hrefFor } from '@stats47/data-configs/content/href';
import { Newspaper } from 'lucide-react';

import { ArticleTeaserCard, ArticleTeaserGrid } from '@/components/surface';

import { readContentRecommendations } from '@/features/content-navigation/server';
import { findKindleProductForBlog, TrackedProductLink } from '@/features/products';

import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import type { AreaType } from '@stats47/types';

interface Props { rankingKey: string; areaType: AreaType; }

/**
 * 「このランキングを読み解く記事」。テーマの「このテーマを読み解く記事」と同じ記事カードの格子で、本文の最後
 * (関連ランキングの後・PR の列の前) に置く (2026-10-29。旧: 右レールの画像付きのリンク行。狭い幅では本文の途中)。
 */
export async function RelatedArticlesCard({ rankingKey, areaType }: Props) {
  if (areaType !== 'prefecture') return null;
  const items = await readContentRecommendations({ sourceId: `ranking:${rankingKey}`, kinds: ['blog'], limit: 3 });
  if (!items.length) return null;
  const product = items.map(item => findKindleProductForBlog(item.key)).find(Boolean);
  return (
    <PanelGrid as="section" aria-labelledby="ranking-related-articles">
      <h2 id="ranking-related-articles" className="flex items-center gap-2 text-base leading-5.5 font-medium text-foreground">
        <Newspaper aria-hidden="true" className="size-4 text-muted-foreground" />
        このランキングを読み解く記事
      </h2>
      <ArticleTeaserGrid>
        {items.map((item) => (
          <ArticleTeaserCard
            key={item.id}
            href={item.href}
            title={item.title}
            thumbnail={{
              lightSrc: blogThumbnailUrl(item.key, 'light'),
              darkSrc: blogThumbnailUrl(item.key, 'dark'),
            }}
            navSurface="ranking_blog"
          />
        ))}
      </ArticleTeaserGrid>
      {product && (
        <TrackedProductLink href={hrefFor('product', { slug: product.slug })} label={`${product.id}:${product.title}`} surface="ranking_product" className="text-sm text-foreground underline-offset-4 hover:underline">
          この記事を収録した本：{product.title}（Kindle）
        </TrackedProductLink>
      )}
    </PanelGrid>
  );
}
