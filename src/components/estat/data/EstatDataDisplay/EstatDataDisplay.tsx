"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Info,
  BarChart3,
  Database,
  Map,
} from "lucide-react";
import { EstatStatsDataResponse } from "@/types/estat";
import { EstatMapView } from "@/components/estat/visualization";
import EstatOverview from "./components/EstatOverview";
import EstatCategoriesTable from "./components/EstatCategoriesTable";
import EstatAreasTable from "./components/EstatAreasTable";
import EstatYearsTable from "./components/EstatYearsTable";
import EstatValuesTable from "./components/EstatValuesTable";
import EstatRawData from "./components/EstatRawData";

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
    "overview" | "categories" | "areas" | "years" | "values" | "map" | "raw"
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-neutral-700">
        <nav className="flex space-x-6 px-4">
          {[
            { id: "overview" as const, label: "概要", icon: Info },
            { id: "categories" as const, label: "カテゴリ", icon: BarChart3 },
            { id: "areas" as const, label: "地域", icon: BarChart3 },
            { id: "years" as const, label: "年度", icon: BarChart3 },
            { id: "values" as const, label: "値", icon: BarChart3 },
            { id: "map" as const, label: "地図", icon: Map },
            { id: "raw" as const, label: "Raw JSON", icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div
        className={activeTab === "overview" || activeTab === "raw" || activeTab === "map" ? "p-4" : ""}
      >
        {activeTab === "overview" && <EstatOverview data={data} />}
        {activeTab === "categories" && (
          <div className="p-4">
            <EstatCategoriesTable data={data} />
          </div>
        )}
        {activeTab === "areas" && (
          <div className="p-4">
            <EstatAreasTable data={data} />
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
        {activeTab === "map" && <EstatMapView data={data} />}
        {activeTab === "raw" && <EstatRawData data={data} />}
      </div>
    </div>
  );
}
