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

type RankingTab =
  | "agriculturalLand"
  | "forestLand"
  | "residentialLand"
  | "commercialLand"
  | "industrialLand"
  | "agriculturalLandRatio"
  | "forestLandRatio"
  | "residentialLandRatio";

interface RankingData {
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
}

/**
 * 土地利用ランキング表示コンポーネント（サーバーコンポーネント）
 * データベースからランキング設定を取得し、RankingClientコンポーネントに渡す
 */
export const LandUseRanking: React.FC<SubcategoryRankingPageProps> = async ({
  category,
  subcategory,
  rankingId,
}) => {
  // データベースからランキング設定を取得
  const config = await getRankingConfig("land-use");

  // フォールバック処理（DB接続失敗時）
  const rankingConfig = config || FALLBACK_CONFIGS["land-use"];

  // ランキングデータを構築
  const rankings: Record<RankingTab, RankingData> = convertToRankingData(
    rankingConfig.rankingItems
  ) as Record<RankingTab, RankingData>;

  // tabOptionsをデータベースから取得
  const tabOptions = convertToTabOptions(rankingConfig.rankingItems) as Array<{
    key: RankingTab;
    label: string;
  }>;

  // rankingIdのバリデーション
  const validRankingIds = Object.keys(rankings) as RankingTab[];
  const defaultRankingId: RankingTab =
    (rankingConfig.subcategory.defaultRankingKey as RankingTab) ||
    "agriculturalLand";

  // rankingIdが指定されていない場合、または無効な場合はデフォルトを使用
  const activeRankingId =
    rankingId && validRankingIds.includes(rankingId as RankingTab)
      ? (rankingId as RankingTab)
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
      />
    </SubcategoryLayout>
  );
};
