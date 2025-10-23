"use client";

import { useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getCategoriesForSidebar } from "@/lib/category";
import { getSidebarNavigationItems, type NavigationItem } from "@/lib/navigation/sidebar-config";

/**
 * サイドバーナビゲーション用のカスタムフック
 * 
 * ナビゲーションデータの取得とアクティブ状態の判定ロジックを集約します。
 */
export function useSidebarNavigation() {
  const pathname = usePathname();

  // カテゴリデータをメモ化
  const categories = useMemo(() => getCategoriesForSidebar(), []);

  // ナビゲーションアイテムをメモ化
  const navigationItems = useMemo(() => getSidebarNavigationItems(), []);

  // アクティブ状態の判定ロジック
  const isActiveLink = useCallback(
    (href: string): boolean => {
      return pathname === href || pathname?.startsWith(`${href}/`);
    },
    [pathname]
  );

  // カテゴリアイテムをナビゲーションアイテム形式に変換
  const categoryItems: NavigationItem[] = useMemo(
    () =>
      categories.map((category) => ({
        href: category.href,
        label: category.name,
        icon: () => null, // CategoryIconコンポーネントで処理
      })),
    [categories]
  );

  return {
    categories,
    navigationItems,
    categoryItems,
    isActiveLink,
  };
}
