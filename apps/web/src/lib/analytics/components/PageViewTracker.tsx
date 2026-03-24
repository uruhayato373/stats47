/**
 * ページビュートラッカー
 *
 * Next.js App Routerのルート変更を検知して、自動的にページビューをGA4に送信します。
 *
 * 使用方法:
 *   <PageViewTracker />
 *
 * 注意:
 *   - クライアントコンポーネントとして実装されています
 *   - ルートレイアウトに配置することで、すべてのページで自動的に動作します
 */

"use client";

import { useEffect } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { pageview } from "@/lib/analytics/pageview";

/**
 * ページビュートラッカーコンポーネント
 *
 * ルート変更を検知して、自動的にページビューをGA4に送信します。
 *
 * @returns null（何も表示しない）
 */
export function PageViewTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // ルートが変更されたときにページビューを送信
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    pageview({
      url,
      title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

