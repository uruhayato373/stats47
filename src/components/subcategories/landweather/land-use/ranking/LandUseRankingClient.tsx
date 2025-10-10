"use client";

import React from "react";
import {
  RankingClient,
  RankingData,
  RankingOption,
} from "@/components/ranking/RankingClient";
import { SubcategoryData } from "@/types/choropleth";

type RankingTab =
  | "agriculturalLand"
  | "forestLand"
  | "residentialLand"
  | "commercialLand"
  | "industrialLand"
  | "agriculturalLandRatio"
  | "forestLandRatio"
  | "residentialLandRatio";

interface LandUseRankingClientProps {
  rankings: Record<RankingTab, RankingData>;
  subcategory: SubcategoryData;
  activeRankingId: RankingTab;
}

export const LandUseRankingClient: React.FC<LandUseRankingClientProps> = ({
  rankings,
  subcategory,
  activeRankingId,
}) => {
  const tabOptions: RankingOption<RankingTab>[] = [
    { key: "agriculturalLand", label: "農用地" },
    { key: "forestLand", label: "森林" },
    { key: "residentialLand", label: "宅地" },
    { key: "commercialLand", label: "商業地" },
    { key: "industrialLand", label: "工業地" },
    { key: "agriculturalLandRatio", label: "農用地割合" },
    { key: "forestLandRatio", label: "森林割合" },
    { key: "residentialLandRatio", label: "宅地割合" },
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
