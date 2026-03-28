"use client";

import { ThemeDashboardTabbed } from "./ThemeDashboardTabbed";

import type { ThemeDashboardClientProps } from "../types";

/**
 * テーマダッシュボード Client Component
 *
 * 全テーマで統一されたタブ型レイアウト（ThemeDashboardTabbed）を使用。
 */
export function ThemeDashboardClient(props: ThemeDashboardClientProps) {
  return <ThemeDashboardTabbed {...props} />;
}
