import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/common/subcategory";
import { RankingClient } from "@/components/ranking/RankingClient";
import {
  getRankingConfig,
  convertToRankingData,
  convertToTabOptions,
} from "@/lib/ranking/get-ranking-items";

interface RankingData {
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
}

interface SubcategoryRankingPageComponentProps
  extends SubcategoryRankingPageProps {}

/**
 * サブカテゴリランキングページコンポーネント（サーバーコンポーネント）
 * サブカテゴリIDに基づいてデータベースからランキング設定を取得し、RankingClientコンポーネントに渡す
 */
export const SubcategoryRankingPage: React.FC<
  SubcategoryRankingPageComponentProps
> = async ({ category, subcategory, rankingId }) => {
  // サブカテゴリIDからランキング設定を取得
  const config = await getRankingConfig(subcategory.id);

  if (!config) {
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

  // ランキングデータを構築
  const rankings: Record<string, RankingData> = convertToRankingData(
    config.rankingItems
  );

  // tabOptionsをデータベースから取得
  const tabOptions = convertToTabOptions(config.rankingItems);

  // rankingIdのバリデーション
  const validRankingIds = Object.keys(rankings);
  const defaultRankingId = config.subcategory?.defaultRankingKey || "default";

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
        rankings={rankings}
        subcategory={subcategory}
        activeRankingId={activeRankingId}
        tabOptions={tabOptions}
        rankingItems={config.rankingItems}
      />
    </SubcategoryLayout>
  );
};
