"use client";

import React, { useState, useEffect } from "react";
import {
  useRankingYears,
  useRankingData,
} from "@/hooks/ranking/useRankingData";
import { RankingVisualization } from "../ui/RankingVisualization";
import { YearSelector } from "../ui/YearSelector";
import { RankingHeader } from "../ui/RankingHeader";
import { LoadingView } from "../ui/LoadingView";
import { ErrorView } from "../ui/ErrorView";
import { PrefectureDataTableClient } from "@/components/choropleth/PrefectureDataTableClient";
import { SubcategoryData } from "@/types/visualization/choropleth";
import { RankingVisualizationOptions } from "@/types/visualization/ranking-options";

interface RankingDataContainerProps {
  statsDataId: string;
  cdCat01: string;
  subcategory: SubcategoryData;
  visualizationOptions?: RankingVisualizationOptions;
  initialYear?: string;
}

/**
 * ランキングデータ取得と表示のコンテナ
 * useSWRによる効率的なデータフェッチとキャッシング
 */
export const RankingDataContainer: React.FC<RankingDataContainerProps> = ({
  statsDataId,
  cdCat01,
  subcategory,
  visualizationOptions,
  initialYear,
}) => {
  // 年度一覧を取得（自動キャッシング）
  const {
    years,
    isLoading: yearsLoading,
    error: yearsError,
  } = useRankingYears(statsDataId, cdCat01);

  // 選択された年度
  const [selectedYear, setSelectedYear] = useState(initialYear || "");

  // 年度が取得できたら最初の年度を選択
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  // ランキングデータを取得（自動キャッシング、リトライ）
  const {
    data,
    isLoading: dataLoading,
    error: dataError,
    refetch,
  } = useRankingData(statsDataId, cdCat01, selectedYear);

  const loading = yearsLoading || dataLoading;
  const error = yearsError || dataError;

  // ローディング表示
  if (loading) {
    return <LoadingView />;
  }

  // エラー表示
  if (error) {
    return (
      <ErrorView
        error={error}
        details={{
          statsDataId,
          cdCat01,
          yearCode: selectedYear,
        }}
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <RankingHeader
        title={`${subcategory.name}ランキング`}
        yearSelector={
          <YearSelector
            years={years}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        }
      />

      {/* メインコンテンツ */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 地図と統計サマリー */}
        <RankingVisualization
          data={data}
          subcategory={subcategory}
          options={visualizationOptions}
        />

        {/* データテーブル */}
        <div className="flex-shrink-0">
          <PrefectureDataTableClient data={data} subcategory={subcategory} />
        </div>
      </div>
    </div>
  );
};
