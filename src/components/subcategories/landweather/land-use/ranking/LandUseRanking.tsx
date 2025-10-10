import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";
import { LandUseRankingClient } from "./LandUseRankingClient";

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
 * ランキングデータを準備し、クライアントコンポーネントに渡す
 */
export const LandUseRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
  rankingId,
}) => {
  // サーバーサイドでランキングデータを準備
  const rankings: Record<RankingTab, RankingData> = {
    agriculturalLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01201",
      unit: "ha",
      name: "農用地",
    },
    forestLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01202",
      unit: "ha",
      name: "森林",
    },
    residentialLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01203",
      unit: "ha",
      name: "宅地",
    },
    commercialLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01204",
      unit: "ha",
      name: "商業地",
    },
    industrialLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01205",
      unit: "ha",
      name: "工業地",
    },
    agriculturalLandRatio: {
      statsDataId: "0000010201",
      cdCat01: "#A01206",
      unit: "%",
      name: "農用地割合",
    },
    forestLandRatio: {
      statsDataId: "0000010201",
      cdCat01: "#A01207",
      unit: "%",
      name: "森林割合",
    },
    residentialLandRatio: {
      statsDataId: "0000010201",
      cdCat01: "#A01208",
      unit: "%",
      name: "宅地割合",
    },
  };

  // rankingIdのバリデーション
  const validRankingIds = Object.keys(rankings) as RankingTab[];
  const defaultRankingId: RankingTab = "agriculturalLand";

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
      <LandUseRankingClient
        rankings={rankings}
        subcategory={subcategory}
        activeRankingId={activeRankingId}
      />
    </SubcategoryLayout>
  );
};
