import { ContentNavigation } from '@/components/rail/ContentNavigation';

import { readContentRecommendations } from '@/features/content-navigation/server';

import type { AreaHighlights } from '@stats47/area-profile';
interface Props { highlights: AreaHighlights; areaCode?: string; limit?: number; }
export async function AreaRelatedBlogArticles({ highlights, areaCode, limit = 3 }: Props) {
  const rankingKeys = [...highlights.top, ...highlights.bottom].map(row => row.rankingKey);
  const items = await readContentRecommendations({sourceId: `area:${areaCode ?? ''}`, kinds: ['blog'], rankingKeys, limit});
  // 関係の補助ラベル (「同じデータを読み解く記事」) は見出しと同じことを繰り返すだけなので渡さない
  const withoutReason = items.map((item) => ({ ...item, reason: '' }));
  return <ContentNavigation title="この県の特徴を読み解く記事" items={withoutReason} surface="area_blog" columns={3} />;
}
