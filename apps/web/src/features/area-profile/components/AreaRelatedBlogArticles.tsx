import { RelatedArticles } from '@/features/content-navigation/RelatedArticles';
import { readContentRecommendations } from '@/features/content-navigation/server';

import type { AreaHighlights } from '@stats47/area-profile';

interface AreaRelatedBlogArticlesProps {
  highlights: AreaHighlights;
  areaCode?: string;
  limit?: number;
}

/** 県の上位・下位の指標から選んだ記事を共通の関連記事欄へ渡す。 */
export async function AreaRelatedBlogArticles({
  highlights,
  areaCode,
  limit = 3,
}: AreaRelatedBlogArticlesProps) {
  const rankingKeys = [...highlights.top, ...highlights.bottom].map(
    (row) => row.rankingKey
  );
  const items = await readContentRecommendations({
    sourceId: `area:${areaCode ?? ''}`,
    kinds: ['blog'],
    rankingKeys,
    limit,
  });
  return <RelatedArticles items={items} surface="area_blog" />;
}
