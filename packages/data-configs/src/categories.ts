/**
 * カテゴリマスタの読み込み口。
 *
 * 記録の正本は `data/categories/categories.json` (カタログの categories.master。JSON Schema 付き)。
 * キーの型 CategoryKey は同じ JSON から生成する (category-keys.generated.ts)。ここは型・読み込み・引く関数だけを持つ。
 * 配列の順が表示順 (displayOrder)。アイコン SVG は R2 `app/categories/svg/<key>.svg`。
 */

import categoriesDoc from "../../../data/categories/categories.json";

/** 17 軸のキー一覧。軽量 subpath `@stats47/data-configs/categories` から引けるよう再 export する。 */
export { CATEGORY_KEYS, type CategoryKey } from "./category-keys.generated";

export interface CategoryMeta {
  categoryKey: string;
  categoryName: string;
  /** lucide-react アイコン名 (UI / categories snapshot 用)。 */
  icon: string;
  /** 表示順 (配列の index と一致)。 */
  displayOrder: number;
  /** SEO 用カテゴリ概要 (curiosity gap 付き・140字前後)。未設定時は page.tsx のフォールバックが使用。 */
  description?: string;
}

export const CATEGORIES: readonly CategoryMeta[] = categoriesDoc.categories.map(
  ({ key, name, icon, description }, displayOrder) => ({
    categoryKey: key,
    categoryName: name,
    icon,
    displayOrder,
    description,
  }),
);

const BY_KEY: ReadonlyMap<string, CategoryMeta> = new Map(
  CATEGORIES.map((c) => [c.categoryKey, c]),
);

/** categoryKey から表示名を引く。未知キーは null。 */
export function getCategoryName(categoryKey: string): string | null {
  return BY_KEY.get(categoryKey)?.categoryName ?? null;
}

/** categoryKey から SEO 用 description を引く。未知キーは null。 */
export function getCategoryDescription(categoryKey: string): string | null {
  return BY_KEY.get(categoryKey)?.description ?? null;
}

/** displayOrder 順の全カテゴリ。 */
export function listCategories(): readonly CategoryMeta[] {
  return CATEGORIES;
}
