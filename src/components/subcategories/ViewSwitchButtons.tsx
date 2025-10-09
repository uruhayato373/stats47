"use client";

import React from "react";
import Link from "next/link";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface ViewSwitchButtonsProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentView: "dashboard" | "ranking";
  areaCode?: string; // dashboardの場合のみ
}

/**
 * ダッシュボード/ランキング切り替えボタン
 */
export const ViewSwitchButtons: React.FC<ViewSwitchButtonsProps> = ({
  category,
  subcategory,
  currentView,
  areaCode = "00000",
}) => {
  const dashboardHref = `/${category.id}/${subcategory.id}/dashboard/${areaCode}`;
  const rankingHref = `/${category.id}/${subcategory.id}/ranking`;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Link
        href={rankingHref}
        className={`
          inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border transition-colors
          ${
            currentView === "ranking"
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500"
          }
        `}
        aria-current={currentView === "ranking" ? "page" : undefined}
      >
        ランキング
      </Link>
      <Link
        href={dashboardHref}
        className={`
          inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border transition-colors
          ${
            currentView === "dashboard"
              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500"
          }
        `}
        aria-current={currentView === "dashboard" ? "page" : undefined}
      >
        ダッシュボード
      </Link>
    </div>
  );
};
