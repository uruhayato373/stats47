"use client";

import { useState, useEffect } from "react";
import { EstatMetaInfoFetcher } from "@/components/molecules/EstatMetaInfoFetcher";
import { EstatMetaInfoDisplay } from "@/components/templates/EstatMetaInfoDisplay";
import { EstatMetaInfoPageHeader } from "@/components/organisms/estat-api/EstatMetaInfoPageHeader";
import { EstatMetaInfoSidebar } from "@/components/organisms/estat-api/EstatMetaInfoSidebar";
import {
  estatAPI,
  EstatMetaInfoResponse,
  SavedEstatMetainfoItem,
} from "@/lib/estat-api";

interface EstatMetainfoPageProps {
  initialSavedMetadata?: SavedEstatMetainfoItem[];
}

export default function EstatMetainfoPage({
  initialSavedMetadata = [],
}: EstatMetainfoPageProps) {
  const [metaInfo, setMetaInfo] = useState<EstatMetaInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatsId, setCurrentStatsId] = useState<string>("");

  const handleFetchMetaInfo = async (statsDataId: string) => {
    setLoading(true);
    setError(null);
    setCurrentStatsId(statsDataId);

    try {
      const response = await estatAPI.getMetaInfo({ statsDataId });
      setMetaInfo(response);
    } catch (err) {
      console.error("Meta info fetch error:", err);
      setError(
        err instanceof Error ? err.message : "不明なエラーが発生しました"
      );
      setMetaInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentStatsId) {
      handleFetchMetaInfo(currentStatsId);
    }
  };

  const handleSidebarItemView = (item: SavedEstatMetainfoItem) => {
    if (item.stats_data_id) {
      handleFetchMetaInfo(item.stats_data_id);
    }
  };

  useEffect(() => {
    // 初回マウント時に最初のアイテムを自動読み込み
    if (initialSavedMetadata && initialSavedMetadata.length > 0) {
      // stats_data_idでソートして最初のアイテムを取得
      const sortedData = [...initialSavedMetadata].sort((a, b) => {
        const aId = a.stats_data_id || "";
        const bId = b.stats_data_id || "";
        return aId.localeCompare(bId);
      });

      const firstItem = sortedData[0];
      if (firstItem.stats_data_id) {
        handleFetchMetaInfo(firstItem.stats_data_id);
      }
    }
  }, []); // 空の依存配列で初回のみ実行

  return (
    <div className="transition-all duration-300 px-3 pb-3 min-h-screen">
      {/* ヘッダーセクション - 横幅いっぱい */}
      <div>
        <EstatMetaInfoPageHeader
          loading={loading}
          currentStatsId={currentStatsId}
          onRefresh={handleRefresh}
        />
      </div>

      {/* メインコンテンツとサイドバーを横並び */}
      <div className="flex flex-col lg:flex-row min-h-full">
        {/* メイン作業エリア */}
        <div className="flex-1 bg-white dark:bg-neutral-800">
          {/* メインコンテンツ */}
          <div className="p-4 md:p-6 space-y-6">
            {/* メタ情報取得フォーム */}
            <EstatMetaInfoFetcher
              onSubmit={handleFetchMetaInfo}
              loading={loading}
            />

            {/* メタ情報表示 */}
            <EstatMetaInfoDisplay
              key={
                metaInfo?.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"] ||
                "empty"
              }
              metaInfo={metaInfo}
              loading={loading}
              error={error}
            />
          </div>
        </div>

        {/* 縦線 */}
        <div className="hidden lg:block w-px border-s border-gray-200 dark:border-neutral-700"></div>

        {/* 保存済みデータサイドバー - 右側に固定表示 */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <EstatMetaInfoSidebar
            className="h-full"
            initialData={initialSavedMetadata}
            onView={handleSidebarItemView}
          />
        </div>
      </div>
    </div>
  );
}
