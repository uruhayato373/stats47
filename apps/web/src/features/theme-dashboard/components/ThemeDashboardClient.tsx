"use client";

import { ThemeDashboardTabbed } from "./ThemeDashboardTabbed";
import { ThemeOverviewDashboard } from "./ThemeOverviewDashboard";

import type { ThemeDashboardClientProps } from "../types";

/**
 * テーマダッシュボード Client Component
 *
 * カタログの overview があるテーマは概況・比較を先に表示し、その他は従来のレイアウトを使用。
 * useSearchParams を useEffect+window.location.search に置き換えたため Suspense は不要。
 */
export function ThemeDashboardClient(props: ThemeDashboardClientProps) {
  if (props.overview) {
    return <ThemeOverviewDashboard {...props} overview={props.overview} />;
  }
  return <ThemeDashboardTabbed {...props} />;
}
