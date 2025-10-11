"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EstatRankingClient } from "@/components/ranking";
import { RankingClientProps } from "./types";

/**
 * 汎用的なランキング表示クライアントコンポーネント
 *
 * 統計項目のランキング表示とナビゲーションを提供する。
 * 地図とデータテーブルを表示し、右側に統計項目のリストを表示する。
 *
 * @template T - 統計項目のキーの型
 * @param props - RankingClientProps
 * @returns JSX.Element
 */
export function RankingClient<T extends string>({
  rankings,
  subcategory,
  activeRankingId,
  tabOptions,
}: RankingClientProps<T>) {
  const params = useParams();
  const categoryId = params.category as string;
  const subcategoryId = params.subcategory as string;

  const activeRanking = rankings[activeRankingId];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* メインコンテンツ */}
      <div className="flex-1">
        <EstatRankingClient
          params={{
            statsDataId: activeRanking.statsDataId,
            cdCat01: activeRanking.cdCat01,
          }}
          subcategory={{
            ...subcategory,
            unit: activeRanking.unit,
            name: activeRanking.name,
          }}
          title={`${activeRanking.name}ランキング`}
          options={{
            colorScheme: subcategory.colorScheme || "interpolateGreens",
            divergingMidpoint: "zero",
          }}
          mapWidth={800}
          mapHeight={600}
        />
      </div>

      {/* 右側のリスト */}
      <div className="lg:w-60 flex-shrink-0">
        <div className="lg:border-l border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              統計項目
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
                  >
                    {option.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
