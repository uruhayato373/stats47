import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";
import { LandAreaRankingClient } from "./LandAreaRankingClient";

type RankingTab =
  | "totalAreaExcluding"
  | "totalAreaIncluding"
  | "habitableArea"
  | "majorLakeArea"
  | "totalAreaIncludingRatio"
  | "areaRatio"
  | "habitableAreaRatio";

interface RankingData {
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
}

/**
 * 土地面積ランキング表示コンポーネント（サーバーコンポーネント）
 * ランキングデータを準備し、クライアントコンポーネントに渡す
 */
export const LandAreaRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
  rankingId,
}) => {
  // サーバーサイドでランキングデータを準備
  const rankings: Record<RankingTab, RankingData> = {
    totalAreaExcluding: {
      statsDataId: "0000010102",
      cdCat01: "B1101",
      unit: "ha",
      name: "総面積（北方地域及び竹島を除く）",
    },
    totalAreaIncluding: {
      statsDataId: "0000010102",
      cdCat01: "B1102",
      unit: "ha",
      name: "総面積（北方地域及び竹島を含む）",
    },
    habitableArea: {
      statsDataId: "0000010102",
      cdCat01: "B1103",
      unit: "ha",
      name: "可住地面積",
    },
    majorLakeArea: {
      statsDataId: "0000010102",
      cdCat01: "B1104",
      unit: "ha",
      name: "主要湖沼面積",
    },
    totalAreaIncludingRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B011001",
      unit: "100km²",
      name: "総面積（北方地域及び竹島を含む）",
    },
    areaRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B01101",
      unit: "%",
      name: "面積割合（全国面積に占める割合）",
    },
    habitableAreaRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B01301",
      unit: "%",
      name: "可住地面積割合",
    },
  };

  // rankingIdのバリデーション
  const validRankingIds = Object.keys(rankings) as RankingTab[];
  const defaultRankingId: RankingTab = "totalAreaExcluding";

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
      <LandAreaRankingClient
        rankings={rankings}
        subcategory={subcategory}
        activeRankingId={activeRankingId}
      />
    </SubcategoryLayout>
  );
};
