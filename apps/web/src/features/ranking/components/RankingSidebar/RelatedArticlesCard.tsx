import { ContentNavigation } from '@/components/rail/ContentNavigation';
import { railNavRowClassName } from '@/components/surface';

import { readContentRecommendations } from '@/features/content-navigation/server';
import { findKindleProductForBlog, TrackedProductLink } from '@/features/products';

import type { AreaType } from '@stats47/types';

interface Props { rankingKey: string; areaType: AreaType; }
export async function RelatedArticlesCard({ rankingKey, areaType }: Props) {
  if (areaType !== 'prefecture') return null;
  const items = await readContentRecommendations({ sourceId: `ranking:${rankingKey}`, kinds: ['blog'], limit: 3 });
  const product = items.map(item => findKindleProductForBlog(item.key)).find(Boolean);
  return <>
    <ContentNavigation title="このランキングを読み解く" items={items} surface="ranking_blog" />
    {product && <TrackedProductLink href={`/products/${product.slug}`} label={`${product.id}:${product.title}`} surface="ranking_product" className={railNavRowClassName({})}>
      この記事を収録した本：{product.title}（Kindle）
    </TrackedProductLink>}
  </>;
}
