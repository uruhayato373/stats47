import 'server-only';
import { cache } from 'react';

import {
  CONTENT_NAVIGATION,
  contentTagIds,
  type ContentPage,
  type ContentLink,
} from '@stats47/data-configs/content';
import {
  selectContentRecommendations,
  type ContentContext,
} from '@stats47/data-configs/content/navigation';
import {
  CONTENT_PAGE_GROUPS,
  CONTENT_ENTITY_LINKS,
  readContentPageGroup,
} from '@stats47/data-configs/content/pages';

import { readNavigationArticlesFromR2 } from '@/features/blog/server';

// React cacheはリクエスト単位。warm isolateに記事の公開状態を保持しない。
const readArticles = cache(readNavigationArticlesFromR2);
const readGroup = cache(readContentPageGroup);
async function readPages(context: ContentContext): Promise<ContentPage[]> {
  const sourceKind = context.sourceId.split(':')[0];
  const groups = CONTENT_PAGE_GROUPS.filter(
    (group) =>
      group.kind !== 'blog' &&
      (context.kinds.includes(group.kind) || group.kind === sourceKind)
  );
  const [rows, articles] = await Promise.all([
    Promise.all(groups.map((group) => readGroup(group.key))),
    readArticles(),
  ]);
  return [
    ...rows.flat(),
    ...articles.map((article) => ({
      id: `blog:${article.slug}`,
      kind: 'blog',
      key: article.slug,
      title: article.title,
      href: `/blog/${article.slug}`,
      published: true,
      rankingKeys: (article.rankingRefs ?? []).map((ref) => ref.rankingKey),
      tagIds: contentTagIds(article.tags.map((tag) => tag.tagKey)),
    })),
  ];
}

export async function readContentRecommendations(context: ContentContext) {
  return selectContentRecommendations(
    await readPages(context),
    [...CONTENT_ENTITY_LINKS, ...CONTENT_NAVIGATION.links] as ContentLink[],
    context
  );
}
