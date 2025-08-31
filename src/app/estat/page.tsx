"use client";

import { useState } from "react";
import {
  Database,
  Save,
  Archive,
  RefreshCw,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MetaInfoFetcher from "@/components/estat/MetaInfoFetcher";
import MetaInfoCard from "@/components/estat/MetaInfoCard";
import MetadataSaver from "@/components/estat/MetadataSaver";
import SavedMetadataDisplay from "@/components/estat/SavedMetadataDisplay";
import { estatAPI } from "@/services/estat-api";
import { EstatMetaInfoResponse } from "@/types/estat";

type TabId = "fetch" | "save" | "saved";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export default function EstatMetaPage() {
  const [metaInfo, setMetaInfo] = useState<EstatMetaInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatsId, setCurrentStatsId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("fetch");

  const tabs: Tab[] = [
    {
      id: "fetch",
      label: "メタ情報取得",
      icon: <Database className="w-4 h-4" />,
      description: "e-Stat APIからメタ情報を取得・表示",
    },
    {
      id: "save",
      label: "メタ情報保存",
      icon: <Save className="w-4 h-4" />,
      description: "取得したメタ情報をデータベースに保存",
    },
    {
      id: "saved",
      label: "保存済みデータ",
      icon: <Archive className="w-4 h-4" />,
      description: "保存済みのメタ情報を閲覧・管理",
    },
  ];

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "fetch":
        return (
          <>
            <MetaInfoFetcher onSubmit={handleFetchMetaInfo} loading={loading} />
            <MetaInfoCard metaInfo={metaInfo} loading={loading} error={error} />
          </>
        );
      case "save":
        return <MetadataSaver />;
      case "saved":
        return <SavedMetadataDisplay />;
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          {/* ヘッダーセクション */}
          <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div>
              <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                e-STAT メタ情報管理
              </h1>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-x-2">
              {currentStatsId && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "更新中..." : "更新"}
                </button>
              )}

              <a
                href="https://www.e-stat.go.jp/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                e-STAT API
              </a>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="border-b border-gray-200 dark:border-neutral-700">
            <nav className="flex space-x-6 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-xs transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:text-neutral-300"
                  }`}
                  title={tab.description}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-4 bg-white dark:bg-neutral-900">
            <div className="max-w-7xl mx-auto space-y-4">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
