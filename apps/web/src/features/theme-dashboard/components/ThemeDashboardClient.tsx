"use client";

import { ThemeDashboardTabbed } from "./ThemeDashboardTabbed";

import type { ThemeDashboardClientProps } from "../types";

/**
 * テーマダッシュボード Client Component
 *
 * 全テーマで統一されたタブ型レイアウト（ThemeDashboardTabbed）を使用。
 * useSearchParams を useEffect+window.location.search に置き換えたため Suspense は不要。
 */
export function ThemeDashboardClient(props: ThemeDashboardClientProps) {
  return <ThemeDashboardTabbed {...props} />;
}
