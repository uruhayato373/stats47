/**
 * 地域コード同期フック
 *
 * URLパスから地域コードを取得し、ストアと自動同期します。
 * URL変更時にストアを更新します。
 *
 * @module hooks/useAreaCode
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAreaCodeStore } from "@/store/area-code-store";

/**
 * 地域コード同期フック
 *
 * URLパスから地域コードを抽出し、ストアを更新します。
 * 初回マウント時とURL変更時にストアと自動同期します。
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useAreaCode(); // URL変更時にストアを自動更新
 *   const { areaCode } = useAreaCodeStore();
 *   // ...
 * }
 * ```
 */
export function useAreaCode() {
  const pathname = usePathname();
  const syncWithUrl = useAreaCodeStore((state) => state.syncWithUrl);

  // URL変更時にストアを更新
  useEffect(() => {
    if (pathname) {
      syncWithUrl(pathname);
    }
  }, [pathname, syncWithUrl]);
}

