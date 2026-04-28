import { cache } from "react";

import {
  getCategoryMetadata,
  readCategoriesFromR2,
  readCategoryByKeyFromR2,
} from "@stats47/category/server";

// R2 snapshot 経由で D1 read を排除。reader 内部に module-level cache あり。
export const listCategories = cache(readCategoriesFromR2);
export const findCategoryByKey = readCategoryByKeyFromR2;
export { getCategoryMetadata };

