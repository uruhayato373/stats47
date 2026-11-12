import 'server-only';
import { contentTagIds } from '@stats47/data-configs/content';

import { RelatedArticles } from '@/features/content-navigation/RelatedArticles';
import { readContentRecommendations } from '@/features/content-navigation/server';

interface Props { themeKey?: string; tagKeys: string[]; rankingKeys?: string[]; limit?: number; }

/** テーマの指標・タグから選んだ記事を共通の関連記事欄へ渡す。 */
export async function ThemeRelatedArticles({ themeKey, tagKeys, rankingKeys = [], limit = 3 }: Props) {
  const items = await readContentRecommendations({sourceId: `theme:${themeKey ?? ''}`, kinds: ['blog'], ...(themeKey ? {} : {rankingKeys}), tagIds: contentTagIds(tagKeys), limit});
  return <RelatedArticles items={items} surface="theme_blog" />;
}
