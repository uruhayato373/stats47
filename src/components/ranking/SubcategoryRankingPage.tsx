import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/common/subcategory";
import { RankingClient } from "@/components/ranking/RankingClient";
import { fetchRankingItemsBySubcategory } from "@/lib/ranking/ranking-items";

/**
 * サブカテゴリランキングページコンポーネント（サーバーコンポーネント）
 * サブカテゴリIDに基づいてデータベースからランキング設定を取得し、RankingClientコンポーネントに渡す
 */
export const SubcategoryRankingPage: React.FC<
  SubcategoryRankingPageProps
> = async ({ category, subcategory, rankingId }) => {
  // サブカテゴリIDからランキング設定を取得
  const rankingConfig = await fetchRankingItemsBySubcategory(subcategory.id);

  if (!rankingConfig) {
    return (
      <SubcategoryLayout
        category={category}
        subcategory={subcategory}
        viewType="ranking"
      >
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">
              ランキングデータを取得できませんでした
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              データベース接続を確認してください
            </p>
          </div>
        </div>
      </SubcategoryLayout>
    );
  }

  // rankingIdのバリデーション
  const validRankingIds = rankingConfig.rankingItems.map(
    (item) => item.ranking_key
  );
  const defaultRankingId =
    rankingConfig.subcategory?.defaultRankingKey || "default";

  // rankingIdが指定されていない場合、または無効な場合はデフォルトを使用
  const activeRankingId =
    rankingId && validRankingIds.includes(rankingId)
      ? rankingId
      : defaultRankingId;

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="ranking"
    >
      <RankingClient
        subcategory={subcategory}
        activeRankingId={activeRankingId}
        rankingItems={rankingConfig.rankingItems}
      />
    </SubcategoryLayout>
  );
};
