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
import { Modal } from "@/components/common/Modal/Modal";
import {
  RankingItemSettings,
  RankingItemSettingsData,
} from "@/components/ranking-settings";
import { Settings } from "lucide-react";

interface RankingDataContainerProps {
  statsDataId: string;
  cdCat01: string;
  subcategory: SubcategoryData;
  visualizationOptions?: RankingVisualizationOptions;
  initialYear?: string;
  onSettingsChange?: (settings: RankingItemSettingsData) => Promise<void>;
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
  onSettingsChange,
}) => {
  // モーダルの開閉状態
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        actions={
          onSettingsChange && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              詳細設定
            </button>
          )
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

      {/* 設定モーダル */}
      {onSettingsChange && (
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          size="lg"
        >
          <RankingItemSettings
            statsDataId={statsDataId}
            cdCat01={cdCat01}
            onSave={async (settings) => {
              await onSettingsChange(settings);
              setIsSettingsOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
};
