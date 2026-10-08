import 'server-only';
import { contentTagIds } from '@stats47/data-configs/content';

import { ContentNavigation } from '@/components/rail/ContentNavigation';

import { readContentRecommendations } from '@/features/content-navigation/server';
interface Props { themeKey?: string; tagKeys: string[]; rankingKeys?: string[]; limit?: number; }
export async function ThemeRelatedArticles({ themeKey, tagKeys, rankingKeys = [], limit = 3 }: Props) {
  const items = await readContentRecommendations({sourceId: `theme:${themeKey ?? ''}`, kinds: ['blog'], ...(themeKey ? {} : {rankingKeys}), tagIds: contentTagIds(tagKeys), limit});
  if (!items.length) return null;
  return <ContentNavigation title="このテーマを読み解く記事" items={items} surface="theme_blog" columns={3} />;
}
