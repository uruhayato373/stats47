import { CONTENT_NAVIGATION, resolveContentTag, contentTagIds } from '@stats47/data-configs/content';

/** 分類軸同士の明示的な対応は data/content/navigation.json のID参照で管理する。 */
export const CATEGORY_BLOG_TAG_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(CONTENT_NAVIGATION.categoryTags).map(([key, tagId]) => [key, resolveContentTag(tagId)!.key]),
);
export function getCategoryKeysForBlogTagKeys(tagKeys: readonly string[]): string[] {
  const tags = new Set(contentTagIds(tagKeys));
  return Object.entries(CONTENT_NAVIGATION.categoryTags)
    .filter(([categoryKey, tagId]) => tags.has(tagId) || tagKeys.includes(categoryKey))
    .map(([categoryKey]) => categoryKey);
}
