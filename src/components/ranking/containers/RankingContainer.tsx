"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { RankingDataContainer } from "./RankingDataContainer";
import { RankingLayout } from "../ui/RankingLayout";
import { LoadingView } from "../ui/LoadingView";
import { RankingNavigation } from "../RankingClient/RankingNavigation";
import { RankingNavigationEditable } from "../RankingClient/RankingNavigationEditable";
import { RankingClientProps, RankingData } from "@/types/models/ranking";

/**
 * ランキング表示のメインコンテナ
 *
 * 責務:
 * - ルーティング情報の取得
 * - 認証状態の管理
 * - アクティブなランキングアイテムの選択
 * - ナビゲーションとメインコンテンツの配置
 */
export function RankingContainer<T extends string>({
  subcategory,
  activeRankingKey,
  rankingItems,
}: RankingClientProps<T>) {
  const params = useParams();
  const { isAdmin, isLoading } = useAuth();

  // ローディング中はローディング表示
  if (isLoading) {
    return <LoadingView message="認証情報を読み込み中..." />;
  }

  const categoryId = params.category as string;
  const subcategoryId = params.subcategory as string;

  // rankingItemsからランキングデータを動的に構築
  const rankings: Record<string, RankingData> = {};
  if (rankingItems) {
    rankingItems.forEach((item) => {
      rankings[item.rankingKey] = {
        rankingKey: item.rankingKey,
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
      <RankingLayout
        main={
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              ランキングデータが見つかりません
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              指定されたランキング項目のデータが存在しません。
            </p>
          </div>
        }
        navigation={
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
        }
      />
    );
  }

  return (
    <RankingLayout
      main={
        <RankingDataContainer
          rankingKey={activeRanking.rankingKey}
          subcategory={{
            ...subcategory,
            unit: activeRanking.unit,
            name: activeRanking.name,
          }}
        />
      }
      navigation={
        isAdmin && rankingItems ? (
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
        )
      }
    />
  );
}
