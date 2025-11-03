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
  const syncWithUrl = usePageTypeStore((state) => state.syncWithUrl);

  // URL変更時にストアを更新
  useEffect(() => {
    if (pathname) {
      syncWithUrl(pathname);
    }
  }, [pathname, syncWithUrl]);
}

