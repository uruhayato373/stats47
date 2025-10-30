"use server";

import { revalidateTag } from "next/cache";

import {
  listCategoriesWithSubcategories,
  updateCategoryService,
  deleteCategoryService,
  updateSubcategoryService,
  deleteSubcategoryService,
} from "../services/category-service";

import type { Category, Subcategory } from "../types/category.types";

export async function listCategoriesAction(): Promise<Category[]> {
  "use cache";
  return await listCategoriesWithSubcategories();
}

export async function updateCategoryAction(
  categoryKey: string,
  data: {
    categoryKey?: string;
    categoryName?: string;
    icon?: string | null;
    displayOrder?: number;
  }
): Promise<Category | null> {
  const updated = await updateCategoryService(categoryKey, data);
  revalidateTag("categories");
  return updated;
}

export async function deleteCategoryAction(categoryKey: string): Promise<boolean> {
  const ok = await deleteCategoryService(categoryKey);
  if (ok) revalidateTag("categories");
  return ok;
}

export async function updateSubcategoryAction(
  subcategoryKey: string,
  data: {
    subcategoryKey?: string;
    subcategoryName?: string;
    categoryKey?: string;
    displayOrder?: number;
  }
): Promise<Subcategory | null> {
  const updated = await updateSubcategoryService(subcategoryKey, data);
  revalidateTag("categories");
  return updated;
}

export async function deleteSubcategoryAction(
  subcategoryKey: string
): Promise<boolean> {
  const ok = await deleteSubcategoryService(subcategoryKey);
  if (ok) revalidateTag("categories");
  return ok;
}

export async function revalidateCategoriesAction(): Promise<void> {
  revalidateTag("categories");
}


