import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";
import { RankingClient } from "@/components/ranking/RankingClient";
import {
  getRankingConfig,
  convertToRankingData,
  convertToTabOptions,
  FALLBACK_CONFIGS,
} from "@/lib/ranking/get-ranking-items";

interface RankingData {
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
}

interface GenericRankingProps extends SubcategoryRankingPageProps {
  isAdmin?: boolean;
}

/**
 * 汎用ランキング表示コンポーネント（サーバーコンポーネント）
 * サブカテゴリIDに基づいてデータベースからランキング設定を取得し、RankingClientコンポーネントに渡す
 */
export const GenericRanking: React.FC<GenericRankingProps> = async ({
  category,
  subcategory,
  rankingId,
  isAdmin = false,
}) => {
  // サブカテゴリIDからランキング設定を取得
  const config = await getRankingConfig(subcategory.id);

  // フォールバック処理（DB接続失敗時）
  const rankingConfig = config || FALLBACK_CONFIGS[subcategory.id];

  // ランキングデータを構築（rankingItemsが存在する場合のみ）
  const rankings: Record<string, RankingData> = rankingConfig?.rankingItems
    ? convertToRankingData(rankingConfig.rankingItems)
    : {};

  // tabOptionsをデータベースから取得（rankingItemsが存在する場合のみ）
  const tabOptions = rankingConfig?.rankingItems
    ? convertToTabOptions(rankingConfig.rankingItems)
    : [];

  // rankingIdのバリデーション
  const validRankingIds = Object.keys(rankings);
  const defaultRankingId =
    rankingConfig?.subcategory?.defaultRankingKey || "default";

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
        rankingItems={rankingConfig?.rankingItems || []}
        isAdmin={isAdmin}
      />
    </SubcategoryLayout>
  );
};
