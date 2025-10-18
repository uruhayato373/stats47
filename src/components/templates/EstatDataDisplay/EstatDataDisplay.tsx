"use client";

import { useState } from "react";
import { AlertTriangle, Info, BarChart3, Database } from "lucide-react";
import { EstatStatsDataResponse } from "@/lib/estat-api";
import { EstatOverview } from "@/components/organisms/estat-api/EstatOverview";
import { EstatCategoriesTable } from "@/components/organisms/estat-api/EstatCategoriesTable";
import { EstatYearsTable } from "@/components/organisms/estat-api/EstatYearsTable";
import { EstatValuesTable } from "@/components/organisms/estat-api/EstatValuesTable";
import { EstatRawData } from "@/components/organisms/estat-api/EstatRawData";
import {
  TabNavigation,
  type TabItem,
} from "@/components/molecules/TabNavigation";

interface EstatDataDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
}

export default function EstatDataDisplay({
  data,
  loading,
  error,
}: EstatDataDisplayProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "categories" | "years" | "values" | "raw"
  >("overview");

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="p-8 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-neutral-400">
            データを取得中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-red-700">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                データ取得エラー
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
            データ取得前
          </h3>
          <p className="text-gray-600 dark:text-neutral-400">
            上のフォームからパラメータを入力してデータを取得してください
          </p>
        </div>
      </div>
    );
  }

  const tabs: TabItem[] = [
    { id: "overview", label: "概要", icon: Info },
    { id: "categories", label: "カテゴリ", icon: BarChart3 },
    { id: "years", label: "年度", icon: BarChart3 },
    { id: "values", label: "値", icon: BarChart3 },
    { id: "raw", label: "Raw JSON", icon: Database },
  ];

  return (
    <div>
      {/* タブナビゲーション */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        spacing="space-x-6"
        iconSize="w-4 h-4"
        showCount={false}
        className="px-4"
      />

      {/* タブコンテンツ */}
      <div
        className={activeTab === "overview" || activeTab === "raw" ? "p-4" : ""}
      >
        {activeTab === "overview" && <EstatOverview data={data} />}
        {activeTab === "categories" && (
          <div className="p-4">
            <EstatCategoriesTable data={data} />
          </div>
        )}
        {activeTab === "years" && (
          <div className="p-4">
            <EstatYearsTable data={data} />
          </div>
        )}
        {activeTab === "values" && (
          <div className="p-4">
            <EstatValuesTable data={data} />
          </div>
        )}
        {activeTab === "raw" && <EstatRawData data={data} />}
      </div>
    </div>
  );
}
