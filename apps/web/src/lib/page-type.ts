/**
 * ページタイプ関連のユーティリティ関数
 *
 * @module lib/page-type
 */

import type { PageType } from "@/types/page-type";

/**
 * URLパスからページタイプを抽出
 */
export function extractPageTypeFromPath(pathname: string): PageType | null {
  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];

  if (firstSegment === "ranking") return "ranking";
  if (firstSegment === "blog") return "blog";

  return null;
}
