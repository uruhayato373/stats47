import { contentTagIds } from '@stats47/data-configs/content';

import { ContentNavigation } from '@/components/rail/ContentNavigation';

import { readContentRecommendations } from '@/features/content-navigation/server';
interface Props { tagKeys: string[]; rankingKeys?: string[]; compact?: boolean; }
export async function RelatedRankingsSection({ tagKeys, rankingKeys = [] }: Props) {
  const items = await readContentRecommendations({sourceId: 'context:blog', kinds: ['ranking'], rankingKeys, tagIds: contentTagIds(tagKeys), limit: 3});
  if (!items.length) return null;
  return <ContentNavigation title="この記事のデータを見る" items={items} surface="blog_sidebar" />;
}
