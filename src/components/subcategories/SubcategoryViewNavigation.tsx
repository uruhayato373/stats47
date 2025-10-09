"use client";

import React from "react";
import Link from "next/link";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface SubcategoryViewNavigationProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentView: "dashboard" | "ranking";
  areaCode?: string; // dashboardの場合のみ
}

/**
 * ダッシュボード/ランキング切り替えナビゲーション
 */
export const SubcategoryViewNavigation: React.FC<
  SubcategoryViewNavigationProps
> = ({ category, subcategory, currentView, areaCode = "00000" }) => {
  const dashboardHref = `/${category.id}/${subcategory.id}/dashboard/${areaCode}`;
  const rankingHref = `/${category.id}/${subcategory.id}/ranking`;

  return (
    <div className="border-b border-gray-200 dark:border-neutral-700">
      <nav className="flex space-x-8 px-4" aria-label="ビュー切り替え">
        <Link
          href={dashboardHref}
          className={`
            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
            ${
              currentView === "dashboard"
                ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-300"
            }
          `}
          aria-current={currentView === "dashboard" ? "page" : undefined}
        >
          📊 ダッシュボード
        </Link>
        <Link
          href={rankingHref}
          className={`
            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
            ${
              currentView === "ranking"
                ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-300"
            }
          `}
          aria-current={currentView === "ranking" ? "page" : undefined}
        >
          🏆 都道府県ランキング
        </Link>
      </nav>
    </div>
  );
};
