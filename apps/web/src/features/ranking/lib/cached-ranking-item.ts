import "server-only";

import { cache } from "react";

import { readRankingItemFromR2 } from "@stats47/ranking/server";

// cache() でリクエストレベル dedupe（generateMetadata + ページ本体の重複排除）。
// R2 snapshot reader 内部にも module-level cache あり。
export const cachedFindRankingItem = cache(readRankingItemFromR2);
