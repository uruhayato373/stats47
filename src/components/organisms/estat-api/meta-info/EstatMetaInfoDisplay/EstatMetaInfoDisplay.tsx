"use client";

import React, { useState, useEffect } from "react";
import { Code, Tag } from "lucide-react";
import { EstatMetaInfoResponse } from "@/lib/estat-api";
import { JsonDisplay } from "@/components/molecules/JsonDisplay";
import { EstatUnifiedClassificationTabs } from "@/components/organisms/estat-api/EstatUnifiedClassificationTabs";
import { SaveButton } from "@/components/atoms/SaveButton";
import {
  TabNavigation,
  type TabItem,
} from "@/components/molecules/TabNavigation";
import { safeRender } from "@/lib/estat-api/meta-info";
import {
  useMetaInfoSave,
  useMetaInfoDownload,
} from "@/hooks/estat-api/meta-info";

interface EstatMetaInfoDisplayProps {
  metaInfo: EstatMetaInfoResponse | null;
  loading?: boolean;
  error?: string | null;
}

type TabType = "category" | "json";

export default function EstatMetaInfoDisplay({
  metaInfo,
  loading,
  error,
}: EstatMetaInfoDisplayProps) {
  const [activeTab, setActiveTab] = useState<TabType>("category");
  const { save, saving, saveResult } = useMetaInfoSave();
  const { download } = useMetaInfoDownload();

  // メタ情報が変更されたらタブをリセット
  useEffect(() => {
    setActiveTab("category");
  }, [metaInfo]);

  const handleSave = () => {
    if (metaInfo) {
      save(metaInfo);
    }
  };

  const handleDownload = () => {
    if (metaInfo) {
      download(metaInfo);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
        <div className="flex items-center">
          <svg
            className="w-4 h-4 text-red-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-red-800 font-medium">エラー</h3>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  if (!metaInfo) {
    return null;
  }

  const { GET_META_INFO } = metaInfo;
  const { TABLE_INF, CLASS_INF } = GET_META_INFO.METADATA_INF;

  const metaInfoId = TABLE_INF?.["@id"];

  // タブの設定
  const getTabCount = (tabId: string) => {
    const classObj = CLASS_INF?.CLASS_OBJ?.find((obj) => obj["@id"] === tabId);
    if (!classObj?.CLASS) return 0;
    return Array.isArray(classObj.CLASS) ? classObj.CLASS.length : 1;
  };

  const tabs: TabItem[] = [
    {
      id: "category",
      label: "カテゴリ",
      icon: Tag,
      count: getTabCount("cat01"),
    },
    {
      id: "json",
      label: "JSON レスポンス",
      icon: Code,
      count: 0,
    },
  ].filter((tab) => tab.count > 0 || tab.id === "json");

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 - 統計表基本情報と保存ボタン */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-gray-200 pb-4">
        {/* 統計情報を横一列に小さく表示 */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              {
                label: "統計表題名",
                value: safeRender(
                  metaInfo.GET_META_INFO.METADATA_INF.TABLE_INF.TITLE
                ),
              },
              {
                label: "政府統計名",
                value: safeRender(
                  metaInfo.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME
                ),
              },
              {
                label: "作成機関",
                value: safeRender(
                  metaInfo.GET_META_INFO.METADATA_INF.TABLE_INF.GOV_ORG
                ),
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3"
              >
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {item.label}
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {item.value || "-"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <SaveButton
          onSave={handleSave}
          saving={saving}
          saveResult={saveResult}
        />
      </div>

      {/* タブナビゲーション */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
      />

      {/* タブコンテンツ */}
      <div className="mt-6">
        {activeTab === "category" &&
          CLASS_INF &&
          CLASS_INF.CLASS_OBJ &&
          CLASS_INF.CLASS_OBJ.length > 0 && (
            <EstatUnifiedClassificationTabs
              classObjs={CLASS_INF.CLASS_OBJ}
              metaInfoId={metaInfoId}
            />
          )}

        {activeTab === "json" && (
          <JsonDisplay data={metaInfo} onDownload={handleDownload} />
        )}
      </div>
    </div>
  );
}
