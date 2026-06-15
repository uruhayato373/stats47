import { cache } from "react";

import {
  getCategoryMetadata,
  readCategoriesFromR2,
  readCategoryByKeyFromR2,
} from "@stats47/category/server";

// R2 snapshot 経由で D1 read を排除。reader 内部に module-level cache あり。
export const listCategories = cache(readCategoriesFromR2);
// cache() でリクエストレベル dedupe。ranking 詳細では本体 + RankingSidebar +
// RelatedRankingsGrid + opengraph-image / category ページでは generateMetadata + 本体が
// 同一 categoryKey で重複 fetch していたため、per-request 1 回に集約する。
export const findCategoryByKey = cache(readCategoryByKeyFromR2);
export { getCategoryMetadata };

