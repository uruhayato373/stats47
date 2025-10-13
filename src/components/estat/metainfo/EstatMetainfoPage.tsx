"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  EstatMetaInfoPageHeader,
  EstatMetaInfoFetcher,
  EstatMetaInfoDisplay,
} from "@/components/estat/metainfo";
import { EstatMetaInfoSidebar } from "@/components/estat/metainfo";
import { estatAPI } from "@/services/estat-api";
import { EstatMetaInfoResponse } from "@/lib/estat/types";
import { SavedEstatMetainfoItem } from "@/types/models/estat";

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

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        {/* ヘッダーセクション - 横幅いっぱい */}
        <div className="mb-4">
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
            />
          </div>
        </div>
      </main>
    </>
  );
}
