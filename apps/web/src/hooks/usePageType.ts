/**
 * ページタイプ同期フック
 *
 * URLパスからページタイプを取得し、ストアと自動同期します。
 * URL変更時にストアを更新します。
 *
 * @module hooks/usePageType
 */

"use client";

import { useEffect } from "react";

import { usePathname } from "next/navigation";

import { extractPageTypeFromPath } from "@/lib/page-type";

import { usePageTypeStore } from "@/store/page-type-store";

/**
 * ページタイプ同期フック
 *
 * URLパスからページタイプを抽出し、ストアを更新します。
 * 初回マウント時とURL変更時にストアと自動同期します。
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePageType(); // URL変更時にストアを自動更新
 *   const { pageType } = usePageTypeStore();
 *   // ...
 * }
 * ```
 */
export function usePageType() {
  const pathname = usePathname();
  const setPageType = usePageTypeStore((state) => state.setPageType);

  // URL変更時にストアを更新
  useEffect(() => {
    if (pathname) {
      const extractedPageType = extractPageTypeFromPath(pathname);
      setPageType(extractedPageType);
    }
  }, [pathname, setPageType]);
}

