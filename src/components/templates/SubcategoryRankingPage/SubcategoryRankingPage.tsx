import React from "react";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/common/subcategory";
import { RankingDataContainer } from "@/components/organisms/ranking/RankingDataContainer";
import { RankingLayout } from "@/components/ranking/ui/RankingLayout";
import { RankingNavigation } from "@/components/organisms/ranking/RankingNavigation";
import { fetchRankingItemsBySubcategory } from "@/lib/ranking/ranking-items";

/**
 * サブカテゴリランキングページコンポーネント（サーバーコンポーネント）
 * サブカテゴリIDに基づいてデータベースからランキング設定を取得し、RankingClientコンポーネントに渡す
 */
export const SubcategoryRankingPage: React.FC<
  SubcategoryRankingPageProps
> = async ({ category, subcategory, rankingKey }) => {
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

  // rankingKeyのバリデーション
  const validRankingKeys = rankingConfig.rankingItems.map(
    (item) => item.rankingKey
  );
  const defaultRankingKey =
    rankingConfig.subcategory?.defaultRankingKey || "default";

  // rankingKeyが指定されていない場合、または無効な場合はデフォルトを使用
  const activeRankingKey =
    rankingKey && validRankingKeys.includes(rankingKey)
      ? rankingKey
      : defaultRankingKey;

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="ranking"
    >
      <RankingLayout
        main={<RankingDataContainer rankingConfig={rankingConfig} />}
        navigation={
          <RankingNavigation
            categoryId={category.id}
            subcategoryId={subcategory.id}
            activeRankingId={activeRankingKey}
            tabOptions={rankingConfig.rankingItems
              .filter((item) => item.isActive)
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((item) => ({
                key: item.rankingKey,
                label: item.label,
              }))}
          />
        }
      />
    </SubcategoryLayout>
  );
};
