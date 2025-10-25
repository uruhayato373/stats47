"use client";

import { usePathname } from "next/navigation";

/**
 * URLからカテゴリとサブカテゴリを取得するカスタムフック
 *
 * @returns カテゴリとサブカテゴリの情報
 */
export function useCategoryParams() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  return {
    category: pathSegments[0] || "",
    subcategory: pathSegments[1] || "",
  };
}
