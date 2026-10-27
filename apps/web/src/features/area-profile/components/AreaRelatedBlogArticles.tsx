import { Newspaper } from 'lucide-react';

import { ContentNavigation } from '@/components/rail/ContentNavigation';

import { readContentRecommendations } from '@/features/content-navigation/server';

import type { AreaHighlights } from '@stats47/area-profile';

interface AreaRelatedBlogArticlesProps {
  highlights: AreaHighlights;
  areaCode?: string;
  limit?: number;
}

/**
 * 県の特徴 (上位・下位のランキング) を読み解くブログ記事。県ページ本文の見出し付きカード 1 枚で、
 * 行はサムネイル (16:9・幅 96px) + 題名 + 矢印のリンク行 (RailLinksCard の media 行) を区切り線で並べる。
 * 列数はカードの幅で決める (1 列 20rem 以上を保てる数だけ)。
 */
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
  // 関係の補助ラベル (「同じデータを読み解く記事」) は見出しと同じことを繰り返すだけなので渡さない
  const withoutReason = items.map((item) => ({ ...item, reason: '' }));
  return (
    <ContentNavigation
      title="この県の特徴を読み解く記事"
      icon={<Newspaper />}
      items={withoutReason}
      surface="area_blog"
      columns={3}
    />
  );
}
