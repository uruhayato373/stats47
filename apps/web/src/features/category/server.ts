import { cache } from "react";
import {
  listCategories as listCategoriesRaw,
  findCategoryByKey,
  getCategoryMetadata,
} from "@stats47/category/server";

// cache() でリクエストレベル dedupe（generateMetadata + ページ本体の重複排除）
export const listCategories = cache(listCategoriesRaw);
export { findCategoryByKey, getCategoryMetadata };

