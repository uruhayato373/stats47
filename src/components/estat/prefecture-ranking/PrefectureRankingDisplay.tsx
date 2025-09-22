"use client";

import { useState } from "react";
import { AlertTriangle, Map, Info, BarChart3, Database, Save } from "lucide-react";
import { EstatMapView } from "@/components/estat/visualization";
import { EstatStatsDataResponse } from "@/lib/estat/types";

interface PrefectureRankingDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
}

export default function PrefectureRankingDisplay({
  data,
  loading,
  error,
}: PrefectureRankingDisplayProps) {
  const [activeTab, setActiveTab] = useState<"map" | "ranking" | "raw">("map");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    try {
      // TODO: 地図データ保存のAPIを実装
      const response = await fetch("/api/estat/map/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        alert("地図データを保存しました");
      } else {
        throw new Error("保存に失敗しました");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

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
            上のフォームから統計表IDを入力してデータを取得してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
      {/* ヘッダー */}
      <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
        <div>
          <h2 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-600" />
            都道府県ランキング・地図表示
          </h2>
        </div>

        <div className="flex items-center gap-x-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
          >
            <Save className={`w-3 h-3 ${saving ? "animate-pulse" : ""}`} />
            {saving ? "保存中..." : "地図データ保存"}
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-neutral-700">
        <nav className="flex space-x-6 px-4">
          {[
            { id: "map" as const, label: "地図表示", icon: Map },
            { id: "ranking" as const, label: "ランキング", icon: BarChart3 },
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
      <div className="p-4">
        {activeTab === "map" && (
          <div className="h-96 bg-gray-50 rounded-lg border border-gray-200 dark:bg-neutral-700 dark:border-neutral-600">
            <EstatMapView data={data} className="w-full h-full" />
          </div>
        )}

        {activeTab === "ranking" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
                都道府県ランキング
              </h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center dark:bg-neutral-700">
              <p className="text-gray-600 dark:text-neutral-400">
                ランキング表示機能は開発中です
              </p>
            </div>
          </div>
        )}

        {activeTab === "raw" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
                Raw JSON Data
              </h3>
            </div>
            <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-sm dark:bg-neutral-700">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}