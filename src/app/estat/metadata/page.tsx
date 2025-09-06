"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  EstatMetadataPageHeader,
  EstatMetadataTabNavigation,
  EstatMetadataTabContent,
  TabId,
} from "@/components/estat/metadata";
import { estatAPI } from "@/services/estat-api";
import { EstatMetaInfoResponse } from "@/types/estat";

export default function EstatMetadataPage() {
  const [metaInfo, setMetaInfo] = useState<EstatMetaInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatsId, setCurrentStatsId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("fetch");

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

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          {/* ヘッダーセクション */}
          <EstatMetadataPageHeader
            loading={loading}
            currentStatsId={currentStatsId}
            onRefresh={handleRefresh}
          />

          {/* タブナビゲーション */}
          <EstatMetadataTabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* タブコンテンツ */}
          <EstatMetadataTabContent
            activeTab={activeTab}
            metaInfo={metaInfo}
            loading={loading}
            error={error}
            onFetchMetaInfo={handleFetchMetaInfo}
          />
        </div>
      </main>
    </>
  );
}
