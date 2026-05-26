"use client";

import { Suspense } from "react";

import { ThemeDashboardTabbed } from "./ThemeDashboardTabbed";

import type { ThemeDashboardClientProps } from "../types";

/**
 * テーマダッシュボード Client Component
 *
 * 全テーマで統一されたタブ型レイアウト（ThemeDashboardTabbed）を使用。
 *
 * Suspense でラップ: ThemeDashboardTabbed が useSearchParams を使うため、
 * SSG (next build prerender) が "missing-suspense-with-csr-bailout" で
 * 失敗するのを回避する。
 */
export function ThemeDashboardClient(props: ThemeDashboardClientProps) {
  return (
    <Suspense fallback={null}>
      <ThemeDashboardTabbed {...props} />
    </Suspense>
  );
}
