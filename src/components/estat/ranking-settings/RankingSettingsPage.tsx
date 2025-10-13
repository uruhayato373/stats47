"use client";

/**
 * ランキング設定ページ - メインコンテナ
 *
 * データ取得フロー:
 * Fetcher → handleFetchData → currentParams更新 → Display.tsx内のuseEstatData発火
 * → /api/estat/data呼び出し → e-Stat API → データ表示
 *
 * 役割:
 * - Fetcherコンポーネントからのパラメータを受け取り
 * - パラメータをDisplayコンポーネントに渡す
 * - ランキング設定の保存処理を管理
 * - データ取得はDisplay.tsx内で実行
 */

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

interface RankingSettingsPageProps {
  initialSavedMetadata: SavedMetadataItem[];
}

export default function RankingSettingsPage({
  initialSavedMetadata,
}: RankingSettingsPageProps) {
  // 現在の検索パラメータ - Fetcherから受け取ったパラメータを保存
  const [currentParams, setCurrentParams] =
    useState<PrefectureRankingParams | null>(null);

  /**
   * Fetcherからのパラメータ受け取り処理
   * FetcherコンポーネントのonSubmitコールバックとして呼び出される
   * currentParamsを更新することでDisplay.tsx内のuseEstatDataフックが自動的にデータ取得を開始
   */
  const handleFetchData = (params: PrefectureRankingParams) => {
    setCurrentParams(params); // パラメータ更新でDisplay.tsx内のuseEstatDataが発火
  };

  /**
   * データ再取得処理
   * 現在のパラメータでデータを手動で再取得
   */
  const handleRefresh = () => {
    if (currentParams) {
      // パラメータを再設定することでDisplay.tsx内のuseEstatDataが再実行される
      setCurrentParams({ ...currentParams });
    }
  };

  /**
   * 保存済みデータ選択処理
   * サイドバーから保存済みメタデータを選択した際に呼び出される
   */
  const handleDataSelect = (item: SavedMetadataItem) => {
    // 選択されたデータで新しい検索を実行
    const params: PrefectureRankingParams = {
      statsDataId: item.stats_data_id,
    };
    setCurrentParams(params); // パラメータ更新でデータ取得開始
  };

  /**
   * ランキング設定保存処理
   * Displayコンポーネントから設定変更時に呼び出される
   * 現在は設定をコンソールに出力（将来的にestat_metainfoテーブルに保存予定）
   */
  const handleSaveSettings = async (newSettings: {
    map_color_scheme?: string;
    map_diverging_midpoint?: string;
    ranking_direction?: string;
    conversion_factor?: number;
    decimal_places?: number;
  }) => {
    if (!currentParams) return;

    try {
      // 設定をコンソールに出力（将来的にestat_metainfoテーブルに保存予定）
      console.log("Settings saved:", {
        statsDataId: currentParams.statsDataId,
        categoryCode: currentParams.categoryCode,
        settings: newSettings,
      });
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
        <div>
          <PrefectureRankingPageHeader
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
                loading={false}
              />

              {/* データ表示エリア */}
              <PrefectureRankingDisplay
                params={currentParams}
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
