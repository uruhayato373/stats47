"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { EstatRankingClient } from "@/components/ranking";
import { RankingClientProps, RankingData } from "@/types/models/ranking";
import { RankingNavigation } from "./RankingNavigation";
import { RankingNavigationEditable } from "./RankingNavigationEditable";

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
  subcategory,
  activeRankingKey,
  rankingItems,
}: RankingClientProps<T>) {
  const params = useParams();
  const auth = useAuth();

  // ローディング中はローディング表示
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            認証情報を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = auth.isAdmin;

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 RankingClient Auth:", {
      isAdmin: auth.isAdmin,
      role: auth.user?.role,
      isAuthenticated: auth.isAuthenticated,
      username: auth.user?.username,
    });
  }

  const categoryId = params.category as string;
  const subcategoryId = params.subcategory as string;

  // rankingItemsからランキングデータを動的に構築
  const rankings: Record<string, RankingData> = {};
  if (rankingItems) {
    rankingItems.forEach((item) => {
      rankings[item.rankingKey] = {
        statsDataId: item.statsDataId,
        cdCat01: item.cdCat01,
        unit: item.unit,
        name: item.name,
      };
    });
  }

  // rankingItemsからタブオプションを動的に構築
  const tabOptions =
    rankingItems
      ?.filter((item) => item.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((item) => ({
        key: item.rankingKey,
        label: item.label,
      })) || [];

  const activeRanking = rankings[activeRankingKey];

  // ランキングデータが存在しない場合のフォールバック
  if (!activeRanking) {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              ランキングデータが見つかりません
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              指定されたランキング項目のデータが存在しません。
            </p>
          </div>
        </div>
        <div className="w-full lg:w-80">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">
              利用可能なランキング項目
            </h3>
            <div className="space-y-2">
              {tabOptions.map((option, index) => (
                <div
                  key={`${option.key}-${index}`}
                  className="p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* メインコンテンツ */}
      <div className="flex-1">
        {/* 管理者モードバッジ */}
        {isAdmin && (
          <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                管理者モード: ランキング項目の編集・追加・削除が可能です
              </span>
            </div>
          </div>
        )}

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

      {/* ナビゲーション */}
      {isAdmin && rankingItems ? (
        <RankingNavigationEditable
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          activeRankingId={activeRankingKey}
          tabOptions={tabOptions}
          rankingItems={rankingItems}
          editable={true}
        />
      ) : (
        <RankingNavigation
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          activeRankingId={activeRankingKey}
          tabOptions={tabOptions}
        />
      )}
    </div>
  );
}
