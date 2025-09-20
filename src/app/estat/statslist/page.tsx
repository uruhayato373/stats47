"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  EstatStatsListPageHeader,
  EstatStatsListTabNavigation,
  EstatStatsListTabContent,
  TabId,
} from "@/components/estat/statslist";
import { StatsListSearchResult } from "@/lib/estat-stats-list-manager";

export default function EstatStatsListPage() {
  const [statsListData, setStatsListData] = useState<StatsListSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("search");

  const handleSearchStatsList = async (query: string, filters?: any) => {
    setLoading(true);
    setError(null);
    setCurrentQuery(query);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/estat/statslist/search?${queryParams.toString()}`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json() as { error?: string };
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${await response.text()}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json() as StatsListSearchResult;
      setStatsListData(data);
    } catch (err) {
      console.error("Stats list search error:", err);
      setError(
        err instanceof Error ? err.message : "統計表リスト検索に失敗しました"
      );
      setStatsListData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentQuery) {
      handleSearchStatsList(currentQuery);
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
          <EstatStatsListPageHeader
            loading={loading}
            currentQuery={currentQuery}
            onRefresh={handleRefresh}
          />

          {/* タブナビゲーション */}
          <EstatStatsListTabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* タブコンテンツ */}
          <EstatStatsListTabContent
            activeTab={activeTab}
            statsListData={statsListData}
            loading={loading}
            error={error}
            onSearchStatsList={handleSearchStatsList}
          />
        </div>
      </main>
    </>
  );
}