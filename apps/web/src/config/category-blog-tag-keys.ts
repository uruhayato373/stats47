/**
 * ランキングカテゴリとブログ代表タグの明示対応。
 *
 * 両者は別 taxonomy なので文字列の偶然一致に依存しない。
 */
export const CATEGORY_BLOG_TAG_KEYS: Readonly<Record<string, string>> = {
  landweather: '気候',
  population: '人口',
  laborwage: '労働',
  agriculture: '農業',
  miningindustry: '製造業',
  commercial: '産業構造',
  economy: '経済',
  construction: '住宅',
  energy: 'エネルギー',
  tourism: '観光',
  educationsports: '教育',
  administrativefinancial: '地方財政',
  safetyenvironment: '環境',
  socialsecurity: '社会保障',
  international: '多文化共生',
  infrastructure: 'インフラ',
  ict: 'IT',
};

export function getCategoryKeysForBlogTagKeys(tagKeys: readonly string[]): string[] {
  const tags = new Set(tagKeys);
  return Object.entries(CATEGORY_BLOG_TAG_KEYS)
    .filter(([categoryKey, blogTagKey]) => tags.has(blogTagKey) || tags.has(categoryKey))
    .map(([categoryKey]) => categoryKey);
}
