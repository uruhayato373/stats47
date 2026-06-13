import "server-only";

import { cache } from "react";

import { readRankingItemsByCategoryFromR2 } from "@stats47/ranking/server";

/**
 * リクエストレベルで dedupe した「カテゴリ別ランキング一覧」リーダー。
 *
 * 同一レンダー内で複数の Server Component が同じ categoryKey で
 * `app/category/<key>/items.json` を重複 fetch していたため、React cache() で
 * per-request 1 回に集約する。重複していた呼び出し元:
 * - category ページ: generateMetadata + ページ本体
 * - ranking 詳細ページ: RankingSidebar + RelatedRankingsGrid
 *
 * RSC 文脈外 (Node スクリプト等) では React の dispatcher 不在で素通りするため無害。
 * 循環 import を避けるため本モジュールはコンポーネントを import しない (leaf)。
 */
export const readRankingItemsByCategory = cache(readRankingItemsByCategoryFromR2);
