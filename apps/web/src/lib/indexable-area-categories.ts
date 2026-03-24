/**
 * インデックス対象のエリア×カテゴリ（コンテンツが十分厚い）
 *
 * sitemap.ts と areas/[areaCode]/[slug]/page.tsx で共用。
 * 新カテゴリ追加時はここを更新すること。
 */
export const INDEXABLE_AREA_CATEGORIES = [
  "population",
  "economy",
  "educationsports",
  "socialsecurity",
  "administrativefinancial",
  "commercial",
  "laborwage",
  "safetyenvironment",
  "construction",
  "landweather",
  "tourism",
  "agriculture",
  "miningindustry",
] as const;

export const INDEXABLE_AREA_CATEGORIES_SET = new Set<string>(
  INDEXABLE_AREA_CATEGORIES
);
