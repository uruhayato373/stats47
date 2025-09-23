"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  PrefectureRankingForm,
  PrefectureRankingDisplay,
  PrefectureRankingSidebar,
  PrefectureRankingPageHeader,
} from "@/components/estat/prefecture-ranking";
import { EstatStatsDataResponse } from "@/lib/estat/types";

interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
  timeCode?: string;
}

interface SavedMetadataItem {
  id: number;
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01?: string;
  item_name?: string;
  unit?: string;
  updated_at: string;
  created_at: string;
}

export default function PrefectureRankingPage() {
  const [apiResponse, setApiResponse] = useState<EstatStatsDataResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] =
    useState<PrefectureRankingParams | null>(null);
  const [selectedMetadata, setSelectedMetadata] =
    useState<SavedMetadataItem | null>(null);
  // 年度管理はPrefectureRankingDisplayで行う

  const handleFetchData = async (params: PrefectureRankingParams) => {
    setLoading(true);
    setError(null);
    setCurrentParams(params);

    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒でタイムアウト

      const response = await fetch(
        `/api/estat/data?${queryParams.toString()}`,
        {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = (await response.json()) as { error?: string };
          errorMessage = errorData.error || errorMessage;
        } catch {
          const textResponse = await response.text();
          errorMessage = `HTTP ${response.status}: ${textResponse.substring(
            0,
            100
          )}`;
        }
        throw new Error(errorMessage);
      }

      let data: EstatStatsDataResponse;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText) as EstatStatsDataResponse;
      } catch (jsonError) {
        throw new Error(
          `Invalid JSON response: ${
            jsonError instanceof Error ? jsonError.message : "Unknown error"
          }`
        );
      }

      setApiResponse(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "リクエストがタイムアウトしました。e-STAT APIが応答していない可能性があります。"
        );
      } else {
        setError(
          err instanceof Error ? err.message : "データ取得に失敗しました"
        );
      }
      setApiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentParams) {
      handleFetchData(currentParams);
    }
  };

  const handleDataSelect = (item: SavedMetadataItem) => {
    setSelectedMetadata(item);
    // 選択されたデータで新しい検索を実行（年度情報はhandleFetchDataで取得）
    const params: PrefectureRankingParams = {
      statsDataId: item.stats_data_id,
      // D1データベースには詳細なフィルター情報がないため、統計表IDのみで検索
    };
    handleFetchData(params);
  };

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        {/* ヘッダーセクション - 横幅いっぱい */}
        <div className="mb-4">
          <PrefectureRankingPageHeader
            loading={loading}
            currentStatsId={currentParams?.statsDataId || ""}
            onRefresh={handleRefresh}
          />
        </div>

        {/* メインコンテンツとサイドバーを横並び */}
        <div className="flex flex-col lg:flex-row gap-4 min-h-full">
          {/* メイン作業エリア */}
          <div className="flex-1 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
            {/* メインコンテンツ */}
            <div className="p-4 md:p-6 space-y-6">
              {/* データ取得フォーム */}
              <PrefectureRankingForm
                onSubmit={handleFetchData}
                loading={loading}
              />

              {/* データ表示エリア */}
              <PrefectureRankingDisplay
                data={apiResponse}
                loading={loading}
                error={error}
              />
            </div>
          </div>

          {/* 保存済みデータサイドバー - 右側に固定表示 */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm h-full">
              <PrefectureRankingSidebar
                className="h-full"
                onDataSelect={handleDataSelect}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
