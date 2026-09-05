import { GONE_BLOG_SLUGS } from '../../../config/gone-blog-slugs';

import type { BlogSnapshot } from '../types';

/** 恒久終了の決定は、配信中の旧索引より優先する。無関係な記事行は変更しない。 */
export function excludeGoneBlogArticles(snapshot: BlogSnapshot): BlogSnapshot {
  const removed = snapshot.articles.filter((article) => GONE_BLOG_SLUGS.has(article.slug));
  if (removed.length === 0) return snapshot;
  const removedTagCounts = new Map<string, number>();
  for (const article of removed) {
    if (article.published !== true) continue;
    for (const { tagKey } of article.tags) {
      removedTagCounts.set(tagKey, (removedTagCounts.get(tagKey) ?? 0) + 1);
    }
  }
  return {
    ...snapshot,
    articles: snapshot.articles.filter((article) => !GONE_BLOG_SLUGS.has(article.slug)),
    tagMeta: snapshot.tagMeta
      .map((tag) => ({ ...tag, articleCount: tag.articleCount - (removedTagCounts.get(tag.tagKey) ?? 0) }))
      .filter((tag) => tag.articleCount > 0),
    ...(snapshot.surveyArticleIndex === undefined ? {} : {
      surveyArticleIndex: Object.fromEntries(Object.entries(snapshot.surveyArticleIndex)
        .map(([id, slugs]) => [id, slugs.filter((slug) => !GONE_BLOG_SLUGS.has(slug))])),
    }),
  };
}
