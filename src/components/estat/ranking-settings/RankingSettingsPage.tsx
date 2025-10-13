"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  PrefectureRankingForm,
  PrefectureRankingDisplay,
  PrefectureRankingSidebar,
  PrefectureRankingPageHeader,
} from "@/components/estat/ranking-settings";
import { PrefectureRankingParams, SavedMetadataItem } from "@/types/models";
import { useEstatData } from "@/hooks/ranking/useEstatData";
import { RankingItemSettingsData } from "@/components/ranking-settings";

interface RankingSettingsPageProps {
  initialSavedMetadata: SavedMetadataItem[];
}

export default function RankingSettingsPage({
  initialSavedMetadata,
}: RankingSettingsPageProps) {
  const [currentParams, setCurrentParams] =
    useState<PrefectureRankingParams | null>(null);

  // 設定状態を管理
  const [settings, setSettings] = useState<RankingItemSettingsData>({
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
  });

  // useSWRでデータ取得（自動キャッシング、リトライ）
  const { data, error, isLoading, refetch } = useEstatData(currentParams);

  const handleFetchData = (params: PrefectureRankingParams) => {
    setCurrentParams(params);
  };

  const handleRefresh = () => {
    if (currentParams) {
      refetch();
    }
  };

  const handleDataSelect = (item: SavedMetadataItem) => {
    // 選択されたデータで新しい検索を実行
    const params: PrefectureRankingParams = {
      statsDataId: item.stats_data_id,
    };
    setCurrentParams(params);
  };

  const handleSaveSettings = async (newSettings: RankingItemSettingsData) => {
    if (!currentParams) return;

    try {
      const response = await fetch("/api/ranking-items/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statsDataId: currentParams.statsDataId,
          cdCat01: currentParams.categoryCode || "",
          ...newSettings,
          visualizationSettings: {
            map_color_scheme: newSettings.map_color_scheme,
            map_diverging_midpoint: newSettings.map_diverging_midpoint,
            ranking_direction: newSettings.ranking_direction,
            conversion_factor: newSettings.conversion_factor,
            decimal_places: newSettings.decimal_places,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("設定の保存に失敗しました");
      }

      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  };

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        {/* ヘッダーセクション - 横幅いっぱい */}
        <div className="mb-4">
          <PrefectureRankingPageHeader
            loading={isLoading}
            currentStatsId={currentParams?.statsDataId || ""}
            onRefresh={handleRefresh}
          />
        </div>

        {/* メインコンテンツとサイドバーを横並び */}
        <div className="flex flex-col lg:flex-row gap-4 min-h-full">
          {/* メイン作業エリア */}
          <div className="flex-1 bg-white dark:bg-neutral-800 ">
            {/* メインコンテンツ */}
            <div className="p-2 md:p-4 space-y-6">
              {/* データ取得フォーム */}
              <PrefectureRankingForm
                onSubmit={handleFetchData}
                loading={isLoading}
              />

              {/* データ表示エリア */}
              <PrefectureRankingDisplay
                data={data}
                loading={isLoading}
                error={error}
                params={currentParams}
                settings={settings}
                onSettingsChange={handleSaveSettings}
              />
            </div>
          </div>

          {/* 保存済みデータサイドバー - 右側に固定表示 */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm h-full">
              <PrefectureRankingSidebar
                className="h-full"
                onDataSelect={handleDataSelect}
                initialData={initialSavedMetadata}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
