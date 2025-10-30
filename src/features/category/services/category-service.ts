import "server-only";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategories,
  updateCategory,
  updateSubcategory,
} from "../repositories/category-repository";

import type { Category, Subcategory } from "../types/category.types";

export async function listCategoriesWithSubcategories(): Promise<Category[]> {
  return await listCategories();
}

export async function updateCategoryService(
  categoryKey: string,
  data: {
    categoryKey?: string;
    categoryName?: string;
    icon?: string | null;
    displayOrder?: number;
  }
): Promise<Category | null> {
  if (!categoryKey) throw new Error("categoryKey is required");
  return await updateCategory(categoryKey, data);
}

export async function deleteCategoryService(categoryKey: string): Promise<boolean> {
  if (!categoryKey) throw new Error("categoryKey is required");
  return await deleteCategory(categoryKey);
}

export async function updateSubcategoryService(
  subcategoryKey: string,
  data: {
    subcategoryKey?: string;
    subcategoryName?: string;
    categoryKey?: string;
    displayOrder?: number;
  }
): Promise<Subcategory | null> {
  if (!subcategoryKey) throw new Error("subcategoryKey is required");
  return await updateSubcategory(subcategoryKey, data);
}

export async function deleteSubcategoryService(
  subcategoryKey: string
): Promise<boolean> {
  if (!subcategoryKey) throw new Error("subcategoryKey is required");
  return await deleteSubcategory(subcategoryKey);
}

export async function createCategoryService(data: {
  categoryKey: string;
  name: string;
  icon?: string | null;
  displayOrder?: number;
}): Promise<Category> {
  if (!data.categoryKey || !data.name) {
    throw new Error("categoryKey and name are required");
  }
  return await createCategory(data);
}

export async function createSubcategoryService(data: {
  subcategoryKey: string;
  name: string;
  categoryKey: string;
  displayOrder?: number;
}): Promise<Subcategory> {
  if (!data.subcategoryKey || !data.name || !data.categoryKey) {
    throw new Error("subcategoryKey, name and categoryKey are required");
  }
  return await createSubcategory(data);
}


