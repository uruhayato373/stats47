/**
 * インデックス対象のエリア×カテゴリ（コンテンツが十分厚い）
 *
 * sitemap.ts と areas/[areaCode]/[slug]/page.tsx で共用。
 * 新カテゴリ追加時はここを更新すること。
 *
 * **2026-04 更新**: クロール予算枯渇対策のため 13 → 2 に削減。47 × 13 = 611 URL が
 * 類似テンプレートとして Google に「クロール済み - インデックス未登録」扱いされていた
 * ため、最もコンテンツが厚い population / economy のみ残す。2-4 週間 GSC を観測して
 * 効果があれば他カテゴリを段階的に追加する。
 */
export const INDEXABLE_AREA_CATEGORIES = ["population", "economy"] as const;

export const INDEXABLE_AREA_CATEGORIES_SET = new Set<string>(
  INDEXABLE_AREA_CATEGORIES
);
