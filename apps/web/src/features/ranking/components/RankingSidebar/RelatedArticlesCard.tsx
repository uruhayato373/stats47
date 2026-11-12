import { hrefFor } from '@stats47/data-configs/content/href';

import { RelatedArticles } from '@/features/content-navigation/RelatedArticles';
import { readContentRecommendations } from '@/features/content-navigation/server';
import { findKindleProductForBlog, TrackedProductLink } from '@/features/products';

import type { AreaType } from '@stats47/types';

interface Props { rankingKey: string; areaType: AreaType; }

/** 指標に関連する記事を選び、本文共通の関連記事欄へ渡す。 */
export async function RelatedArticlesCard({ rankingKey, areaType }: Props) {
  if (areaType !== 'prefecture') return null;
  const items = await readContentRecommendations({ sourceId: `ranking:${rankingKey}`, kinds: ['blog'], limit: 3 });
  if (!items.length) return null;
  const product = items.map(item => findKindleProductForBlog(item.key)).find(Boolean);
  return (
    <RelatedArticles items={items} surface="ranking_blog">
      {product && (
        <TrackedProductLink href={hrefFor('product', { slug: product.slug })} label={`${product.id}:${product.title}`} surface="ranking_product" product={product} className="text-sm text-foreground underline-offset-4 hover:underline">
          この記事を収録した本：{product.title}（Kindle）
        </TrackedProductLink>
      )}
    </RelatedArticles>
  );
}
