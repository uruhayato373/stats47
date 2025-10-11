"use client";

import React from "react";
import { useParams } from "next/navigation";
import { EstatRankingClient } from "@/components/ranking";
import { RankingClientProps } from "./types";
import { RankingNavigation } from "./RankingNavigation";

/**
 * 汎用的なランキング表示クライアントコンポーネント
 *
 * 統計項目のランキング表示とナビゲーションを提供する。
 * 地図とデータテーブルを表示し、右側に統計項目のリストを表示する。
 *
 * @template T - 統計項目のキーの型
 * @param props - RankingClientProps
 * @returns JSX.Element
 */
export function RankingClient<T extends string>({
  rankings,
  subcategory,
  activeRankingId,
  tabOptions,
}: RankingClientProps<T>) {
  const params = useParams();
  const categoryId = params.category as string;
  const subcategoryId = params.subcategory as string;

  const activeRanking = rankings[activeRankingId];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* メインコンテンツ */}
      <div className="flex-1">
        <EstatRankingClient
          params={{
            statsDataId: activeRanking.statsDataId,
            cdCat01: activeRanking.cdCat01,
          }}
          subcategory={{
            ...subcategory,
            unit: activeRanking.unit,
            name: activeRanking.name,
          }}
          title={`${activeRanking.name}ランキング`}
          options={{
            colorScheme: subcategory.colorScheme || "interpolateGreens",
            divergingMidpoint: "zero",
          }}
          mapWidth={800}
          mapHeight={600}
        />
      </div>

      {/* ナビゲーション */}
      <RankingNavigation
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        activeRankingId={activeRankingId}
        tabOptions={tabOptions}
      />
    </div>
  );
}
