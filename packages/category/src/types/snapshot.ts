import type { Category } from "./category";

export const CATEGORIES_SNAPSHOT_KEY = "categories/all.json";

export interface CategoriesSnapshot {
  schemaVersion: 2;
  generatedAt: string;
  count: number;
  categories: Category[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCategory(value: unknown, index: number): Category {
  if (!isRecord(value)) throw new Error(`categories[${index}] must be an object`);
  if (typeof value.categoryKey !== "string" || value.categoryKey.length === 0) {
    throw new Error(`categories[${index}].categoryKey must be a non-empty string`);
  }
  if (typeof value.categoryName !== "string" || value.categoryName.length === 0) {
    throw new Error(`categories[${index}].categoryName must be a non-empty string`);
  }
  if (value.icon !== undefined && typeof value.icon !== "string") {
    throw new Error(`categories[${index}].icon must be a string`);
  }
  if (!Number.isInteger(value.displayOrder)) {
    throw new Error(`categories[${index}].displayOrder must be an integer`);
  }
  return {
    categoryKey: value.categoryKey,
    categoryName: value.categoryName,
    ...(value.icon === undefined ? {} : { icon: value.icon }),
    displayOrder: value.displayOrder as number,
  };
}

/** git TS producerとruntime readerが共有するcategories snapshot builder。 */
export function buildCategoriesSnapshot(
  categories: readonly Category[],
  generatedAt = new Date().toISOString(),
): CategoriesSnapshot {
  return {
    schemaVersion: 2,
    generatedAt,
    count: categories.length,
    categories: [...categories],
  };
}

/** schemaVersion無しの旧snapshotだけをv2へ明示移行し、未知versionは拒否する。 */
export function parseCategoriesSnapshot(value: unknown): CategoriesSnapshot {
  if (!isRecord(value)) throw new Error("categories snapshot must be an object");
  if (value.schemaVersion !== undefined && value.schemaVersion !== 2) {
    throw new Error("categories snapshot schemaVersion must be 2 or omitted legacy");
  }
  if (typeof value.generatedAt !== "string" || !Number.isFinite(Date.parse(value.generatedAt))) {
    throw new Error("categories snapshot generatedAt must be a valid date string");
  }
  if (!Array.isArray(value.categories)) {
    throw new Error("categories snapshot categories must be an array");
  }
  const categories = value.categories.map(parseCategory);
  if (!Number.isInteger(value.count) || value.count !== categories.length) {
    throw new Error("categories snapshot count must equal categories.length");
  }
  return buildCategoriesSnapshot(categories, value.generatedAt);
}
