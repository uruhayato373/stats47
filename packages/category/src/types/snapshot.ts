import type { Category } from "./category";

export const CATEGORIES_SNAPSHOT_KEY = "snapshots/categories/all.json";

export interface CategoriesSnapshot {
  generatedAt: string;
  count: number;
  categories: Category[];
}
