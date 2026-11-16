import { hrefFor } from '@stats47/data-configs/content/href';

import { ContentNavigation } from '@/components/rail/ContentNavigation';
import { railNavRowClassName } from '@/components/surface';

import { RelatedArticles } from '@/features/content-navigation/RelatedArticles';
import { readContentRecommendations } from '@/features/content-navigation/server';
import { findKindleProductForBlog, TrackedProductLink } from '@/features/products';

import type { AreaType } from '@stats47/types';

interface Props {
  rankingKey: string;
  areaType: AreaType;
  /** rail = 広い画面の右レールの先頭 (画像付きのリンク行)。body = 狭い画面の本文の途中 (グラフの直後。本文共通の関連記事欄) */
  placement: 'rail' | 'body';
}

/**
 * 指標に関連する記事。2026-10-29 に本文の最後へ移したところ ranking→blog の遷移率が 3.94% から 2.17% に落ちたため、
 * 2026-11-17 に元の位置 (広い画面は右レールの先頭・狭い画面はグラフの直後) へ戻した (improvements `RELATED-ARTICLES-EFFECT-01`)。
 */
export async function RelatedArticlesCard({ rankingKey, areaType, placement }: Props) {
  if (areaType !== 'prefecture') return null;
  const items = await readContentRecommendations({ sourceId: `ranking:${rankingKey}`, kinds: ['blog'], limit: 3 });
  if (!items.length) return null;
  const product = items.map(item => findKindleProductForBlog(item.key)).find(Boolean);
  const productLink = (className: string) => product && (
    <TrackedProductLink href={hrefFor('product', { slug: product.slug })} label={`${product.id}:${product.title}`} surface="ranking_product" product={product} className={className}>
      この記事を収録した本：{product.title}（Kindle）
    </TrackedProductLink>
  );
  if (placement === 'rail') {
    return <>
      <ContentNavigation title="このランキングを読み解く" items={items} surface="ranking_blog" />
      {productLink(railNavRowClassName({}))}
    </>;
  }
  return (
    <RelatedArticles items={items} surface="ranking_blog">
      {productLink('text-sm text-foreground underline-offset-4 hover:underline')}
    </RelatedArticles>
  );
}
