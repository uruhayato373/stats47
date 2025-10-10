"use client";

import React from "react";
import {
  RankingClient,
  RankingData,
  RankingOption,
} from "@/components/ranking/RankingClient";
import { SubcategoryData } from "@/types/choropleth";

type RankingTab =
  | "totalAreaExcluding"
  | "totalAreaIncluding"
  | "habitableArea"
  | "majorLakeArea"
  | "totalAreaIncludingRatio"
  | "areaRatio"
  | "habitableAreaRatio";

interface LandAreaRankingClientProps {
  rankings: Record<RankingTab, RankingData>;
  subcategory: SubcategoryData;
  activeRankingId: RankingTab;
}

export const LandAreaRankingClient: React.FC<LandAreaRankingClientProps> = ({
  rankings,
  subcategory,
  activeRankingId,
}) => {
  const tabOptions: RankingOption<RankingTab>[] = [
    { key: "totalAreaExcluding", label: "総面積（除く）" },
    { key: "totalAreaIncluding", label: "総面積（含む）" },
    { key: "habitableArea", label: "可住地面積" },
    { key: "majorLakeArea", label: "主要湖沼面積" },
    { key: "totalAreaIncludingRatio", label: "総面積（100km²）" },
    { key: "areaRatio", label: "面積割合" },
    { key: "habitableAreaRatio", label: "可住地面積割合" },
  ];

  return (
    <RankingClient
      rankings={rankings}
      subcategory={subcategory}
      activeRankingId={activeRankingId}
      tabOptions={tabOptions}
    />
  );
};
