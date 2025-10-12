"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Database,
  Save,
  Check,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ChoroplethMap } from "@/components/estat/visualization";
import YearSelector from "@/components/common/YearSelector";
import EstatDataSummary from "@/components/estat/visualization/EstatDataSummary";
import ColorSchemeSelector from "@/components/common/ColorSchemeSelector";
import EstatPrefectureDataTable from "@/components/estat/prefecture-ranking/DataTable";
import VisualizationSettingsPanel from "../SettingsPanel";
import { EstatPrefectureRankingDisplayProps } from "./types";
import {
  useVisualizationSettings,
  usePrefectureRankingData,
  useMapOptions,
  useYearSelection,
} from "./hooks";

export default function Display({
  data,
  loading,
  error,
  params,
}: EstatPrefectureRankingDisplayProps) {
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // カスタムフックでロジック分離
  const {
    settings,
    editableSettings,
    setEditableSettings,
    saving,
    saveSuccess,
    saveSettings,
  } = useVisualizationSettings({
    statsDataId: params?.statsDataId,
    categoryCode: params?.categoryCode,
  });

  const { mapOptions, setMapOptions } = useMapOptions({
    initialColorScheme: settings?.map_color_scheme,
    initialDivergingMidpoint: settings?.map_diverging_midpoint,
  });

  const { formattedData, filteredData, summary } = usePrefectureRankingData({
    data,
    selectedYear: "",
    categoryCode: params?.categoryCode,
    settings: editableSettings,
  });

  const { selectedYear, setSelectedYear } = useYearSelection({
    years: formattedData?.years || [],
  });

  // selectedYearが更新されたときにfilteredDataを再計算
  const { filteredData: finalFilteredData } = usePrefectureRankingData({
    data,
    selectedYear,
    categoryCode: params?.categoryCode,
    settings: editableSettings,
  });

  const handleSaveSettings = async () => {
    const settingsToSave = {
      ...editableSettings,
      stats_data_id: params?.statsDataId,
      cat01: params?.categoryCode,
      map_color_scheme: mapOptions.colorScheme,
      map_diverging_midpoint: mapOptions.divergingMidpoint,
    };

    await saveSettings(settingsToSave);
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

  if (!formattedData) return null;

  return (
    <div className="space-y-6">
      <div className="p-4">
        {/* 年次セレクター */}
        <YearSelector
          years={formattedData.years}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          className="mb-4"
        />

        {/* カラースキーマと設定ボタン */}
        <div className="flex items-end gap-4 mb-4">
          <div className="flex-1">
            <ColorSchemeSelector
              options={mapOptions}
              onOptionsChange={setMapOptions}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              詳細設定
              {showSettingsPanel ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving || !params?.statsDataId || !params?.categoryCode}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  saveSuccess
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }
                disabled:bg-gray-400 disabled:cursor-not-allowed
              `}
            >
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  保存中...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  保存完了
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  設定を保存
                </>
              )}
            </button>
          </div>
        </div>

        {/* 詳細設定パネル */}
        {showSettingsPanel && (
          <VisualizationSettingsPanel
            editableSettings={editableSettings}
            visualizationSettings={settings}
            params={params}
            onSettingsChange={setEditableSettings}
          />
        )}

        {/* データサマリー */}
        <EstatDataSummary {...summary} />

        {/* 地図 */}
        <div className="w-full h-full overflow-x-auto mb-6">
          <ChoroplethMap
            data={finalFilteredData}
            width={800}
            height={600}
            className="w-full max-w-full"
            options={mapOptions}
          />
        </div>

        {/* テーブル */}
        <EstatPrefectureDataTable
          data={finalFilteredData}
          className="mt-6"
          rankingDirection={
            editableSettings.ranking_direction ||
            settings?.ranking_direction ||
            "desc"
          }
        />
      </div>
    </div>
  );
}
