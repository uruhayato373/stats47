"use client";

import { useState } from "react";
import { AlertTriangle, Database } from "lucide-react";
import { RankingDataContainer } from "@/components/ranking/containers/RankingDataContainer";
import {
  RankingItemSettings,
  RankingItemSettingsData,
} from "@/components/ranking-settings";
import { DisplayProps } from "./types";

export default function Display({
  data,
  loading,
  error,
  params,
}: DisplayProps) {
  const [settings, setSettings] = useState<RankingItemSettingsData>({
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
  });

  const handleSaveSettings = async (newSettings: RankingItemSettingsData) => {
    if (!params) return;

    try {
      const response = await fetch("/api/ranking-items/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statsDataId: params.statsDataId,
          cdCat01: params.categoryCode || "",
          ...newSettings,
          visualizationSettings: {
            map_color_scheme: newSettings.map_color_scheme,
            map_diverging_midpoint: newSettings.map_diverging_midpoint,
            ranking_direction: newSettings.ranking_direction,
            conversion_factor: newSettings.conversion_factor,
            decimal_places: newSettings.decimal_places,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("設定の保存に失敗しました");
      }

      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  };

  // ローディング状態
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
        <p className="mt-4 text-gray-600 dark:text-neutral-400">
          データを取得中...
        </p>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
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
    );
  }

  // データなし状態
  if (!data) {
    return (
      <div className="p-8 text-center">
        <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
          データ取得前
        </h3>
        <p className="text-gray-600 dark:text-neutral-400">
          上のフォームから統計表IDを入力してデータを取得してください
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
          取得したデータの地図表示とランキングが表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ランキング項目設定 */}
      <RankingItemSettings
        statsDataId={params?.statsDataId}
        cdCat01={params?.categoryCode}
        initialSettings={settings}
        onSave={handleSaveSettings}
      />

      {/* RankingDataContainer（データ表示） */}
      {params && (
        <RankingDataContainer
          statsDataId={params.statsDataId}
          cdCat01={params.categoryCode || ""}
          subcategory={{
            id: params.statsDataId,
            categoryId: "prefecture-ranking",
            name: "都道府県ランキング",
            unit: "",
          }}
          visualizationOptions={{
            colorScheme: settings.map_color_scheme,
            divergingMidpoint: settings.map_diverging_midpoint as
              | "zero"
              | "mean"
              | "median"
              | number,
          }}
        />
      )}
    </div>
  );
}
