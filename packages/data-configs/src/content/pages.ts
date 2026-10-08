import manifest from '../../../../data/content/entities.json';

import type { ContentLink, ContentPage } from './index';

export const CONTENT_PAGE_GROUPS = manifest.shards;
export const CONTENT_ENTITY_LINKS = manifest.links as ContentLink[];

/** 配信用の静的JSONを種別ごとに読み、全ページ索引を一括で展開しない。 */
export async function readContentPageGroup(
  key: string
): Promise<ContentPage[]> {
  if (!CONTENT_PAGE_GROUPS.some((group) => group.key === key)) return [];
  const group = (await import(
    `../../../../data/content/pages/${key}.json`
  )) as { default: { pages: ContentPage[] } };
  return group.default.pages;
}
