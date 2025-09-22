"use client";

import { useState } from "react";
import { RefreshCw, Map, ExternalLink } from "lucide-react";
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
  areaCode?: string;
  timeCode?: string;
}

interface SavedRankingDataItem {
  id: string;
  statsDataId: string;
  title: string;
  statName: string;
  govOrg: string;
  categoryCode?: string;
  categoryName?: string;
  areaCode?: string;
  areaName?: string;
  timeCode?: string;
  timeName?: string;
  savedAt: string;
  rankingData?: {
    highest: { prefecture: string; value: string };
    lowest: { prefecture: string; value: string };
    average: string;
  };
}

export default function PrefectureRankingPage() {
  const [apiResponse, setApiResponse] = useState<EstatStatsDataResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<PrefectureRankingParams | null>(
    null
  );
  const [selectedRankingData, setSelectedRankingData] = useState<SavedRankingDataItem | null>(
    null
  );

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

  const handleDataSelect = (item: SavedRankingDataItem) => {
    setSelectedRankingData(item);
    // 選択されたデータで新しい検索を実行
    const params: PrefectureRankingParams = {
      statsDataId: item.statsDataId,
      categoryCode: item.categoryCode,
      areaCode: item.areaCode,
      timeCode: item.timeCode,
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
        <div className="flex flex-col lg:flex-row min-h-full">
          {/* メイン作業エリア */}
          <div className="flex-1 bg-white dark:bg-neutral-800">
            {/* メインコンテンツ */}
            <div className="p-4 md:p-6 space-y-6">
              {/* データ取得フォーム */}
              <PrefectureRankingForm onSubmit={handleFetchData} loading={loading} />

              {/* データ表示エリア */}
              <PrefectureRankingDisplay
                data={apiResponse}
                loading={loading}
                error={error}
              />
            </div>
          </div>

          {/* 縦線 */}
          <div className="hidden lg:block w-px border-s border-gray-200 dark:border-neutral-700"></div>

          {/* 保存済みデータサイドバー - 右側に固定表示 */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <PrefectureRankingSidebar
              className="h-full"
              onDataSelect={handleDataSelect}
            />
          </div>
        </div>
      </main>
    </>
  );
}