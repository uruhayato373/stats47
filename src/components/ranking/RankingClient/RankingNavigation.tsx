"use client";

import React from "react";
import Link from "next/link";
import { RankingOption } from "./types";

export interface RankingNavigationProps<T extends string> {
  categoryId: string;
  subcategoryId: string;
  activeRankingId: T;
  tabOptions: RankingOption<T>[];
  title?: string;
}

/**
 * ランキング統計項目ナビゲーションリスト
 *
 * 統計項目の一覧を表示し、アクティブな項目をハイライトする。
 *
 * @template T - 統計項目のキーの型
 */
export const RankingNavigation = React.memo(function RankingNavigation<
  T extends string
>({
  categoryId,
  subcategoryId,
  activeRankingId,
  tabOptions,
  title = "統計項目",
}: RankingNavigationProps<T>) {
  return (
    <div className="lg:w-60 flex-shrink-0">
      <div className="lg:border-l border-gray-200 dark:border-gray-700">
        <div className="bg-white dark:bg-gray-800 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
          <nav className="space-y-2" aria-label="統計項目">
            {tabOptions.map((option) => {
              const href = `/${categoryId}/${subcategoryId}/ranking/${option.key}`;
              const isActive = activeRankingId === option.key;

              return (
                <Link
                  key={option.key}
                  href={href}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {option.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
});
