"use client";

import { useEffect, useState } from "react";

import { getCategoryIcon } from "@/features/category/utils";
import { listCategoriesAction } from "@/features/category/actions";
import type { Category } from "@/features/category/types/category.types";

import { buildSidebarNavigationItems } from "@/lib/sidebar-config";

import { ActiveSidebarMenuButton } from "./ActiveSidebarMenuButton";

/**
 * 通常ページ用サイドバー（クライアントコンポーネント）
 * ホーム、統計カテゴリーを表示
 */
export function AppSidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const navigationItems = buildSidebarNavigationItems();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await listCategoriesAction();
        setCategories(categoriesData);
      } catch (error) {
        console.error("カテゴリ取得エラー:", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="w-64 h-full bg-sidebar border-r border-border flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Home Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Home
          </h3>
          <div className="space-y-1">
            {navigationItems.home.map((item) => (
              <ActiveSidebarMenuButton key={item.href} href={item.href}>
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </ActiveSidebarMenuButton>
            ))}
          </div>
        </div>

        <div className="border-t border-border my-4" />

        {/* Categories Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            統計カテゴリー
          </h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <ActiveSidebarMenuButton
                key={category.categoryKey}
                href={`/${category.categoryKey}`}
              >
                {(() => {
                  const Icon = getCategoryIcon(category.icon ?? "");
                  return <Icon className="size-4" />;
                })()}
                <span>{category.categoryName}</span>
              </ActiveSidebarMenuButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
