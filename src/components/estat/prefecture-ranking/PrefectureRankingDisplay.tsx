"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertTriangle, Map, Database, Save, Check } from "lucide-react";
import { EstatStatsDataResponse, FormattedEstatData } from "@/lib/estat/types";
import { ChoroplethMap } from "@/components/estat/visualization";
import { TimeSelector } from "@/components/common/TimeSelector";
import EstatDataSummary from "@/components/estat/visualization/EstatDataSummary";
import { EstatStatsDataService } from "@/lib/estat/statsdata";
import ColorSchemeSelector, {
  MapVisualizationOptions,
} from "@/components/common/ColorSchemeSelector";
import PrefectureDataTable from "./PrefectureDataTable";
import {
  VisualizationSettings,
  VisualizationSettingsService
} from "@/lib/ranking/visualization-settings";

interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
  timeCode?: string;
}

interface PrefectureRankingDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
  params: PrefectureRankingParams | null;
}

export default function PrefectureRankingDisplay({
  data,
  loading,
  error,
  params,
}: PrefectureRankingDisplayProps) {
  // EstatDataFormatterで変換
  const formattedData: FormattedEstatData | null = useMemo(() => {
    if (!data) return null;
    return EstatStatsDataService.formatStatsData(data);
  }, [data]);

  // 選択中の年次を管理
  const [selectedYear, setSelectedYear] = useState<string>("");

  // 地図可視化オプションを管理
  const [mapOptions, setMapOptions] = useState<MapVisualizationOptions>({
    colorScheme: "interpolateBlues",
    divergingMidpoint: "zero",
  });

  // 可視化設定を管理
  const [visualizationSettings, setVisualizationSettings] = useState<VisualizationSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // formattedDataが変更されたときに最初の年度を選択
  useEffect(() => {
    if (formattedData && formattedData.years.length > 0) {
      const sortedYears = [...formattedData.years].sort(
        (a, b) => parseInt(b.timeCode) - parseInt(a.timeCode)
      );
      setSelectedYear(sortedYears[0].timeCode);
    } else {
      setSelectedYear("");
    }
  }, [formattedData]);

  // データベースから可視化設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      if (!params?.statsDataId || !params?.categoryCode) return;

      setSettingsLoading(true);
      try {
        const response = await VisualizationSettingsService.fetchSettings(
          params.statsDataId,
          params.categoryCode
        );

        if (response.success) {
          setVisualizationSettings(response.settings);

          // 地図オプションを設定に基づいて更新
          setMapOptions({
            colorScheme: response.settings.map_color_scheme,
            divergingMidpoint: response.settings.map_diverging_midpoint,
          });
        }
      } catch (error) {
        console.error("Failed to load visualization settings:", error);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, [params?.statsDataId, params?.categoryCode]);

  // 設定保存機能
  const saveSettings = async () => {
    if (!params?.statsDataId || !params?.categoryCode) {
      alert("統計表IDとカテゴリコードが必要です");
      return;
    }

    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      const settingsToSave: Partial<VisualizationSettings> = {
        stats_data_id: params.statsDataId,
        cat01: params.categoryCode,
        map_color_scheme: mapOptions.colorScheme,
        map_diverging_midpoint: mapOptions.divergingMidpoint,
        ranking_direction: visualizationSettings?.ranking_direction || "desc",
        conversion_factor: visualizationSettings?.conversion_factor || 1,
        decimal_places: visualizationSettings?.decimal_places || 0,
      };

      const result = await VisualizationSettingsService.saveSettings(settingsToSave);

      if (result.success) {
        setSaveSuccess(true);
        // 成功表示を3秒後に非表示
        setTimeout(() => setSaveSuccess(false), 3000);

        // 設定を再読み込み
        const response = await VisualizationSettingsService.fetchSettings(
          params.statsDataId,
          params.categoryCode
        );
        if (response.success) {
          setVisualizationSettings(response.settings);
        }
      } else {
        alert(`設定の保存に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("設定の保存に失敗しました");
    } finally {
      setSaveLoading(false);
    }
  };

  // 選択された年次でデータをフィルタリング（全国データareaCode=00000を除外、カテゴリコードでもフィルタリング）
  // 単位変換も適用
  const filteredData = useMemo(() => {
    if (!formattedData || !selectedYear) return formattedData?.values || [];

    const filtered = formattedData.values.filter((value) => {
      // 基本的なフィルタリング：年度と全国データの除外
      const basicFilter =
        value.timeCode === selectedYear && value.areaCode !== "00000";

      // カテゴリコードでのフィルタリング
      if (params?.categoryCode) {
        // カンマ区切りの場合は分割して処理
        const categoryCodes = params.categoryCode
          .split(",")
          .map((code) => code.trim());
        return basicFilter && categoryCodes.includes(value.categoryCode);
      }

      return basicFilter;
    });

    // 単位変換を適用
    if (visualizationSettings) {
      return filtered.map((value) => ({
        ...value,
        numericValue: value.numericValue
          ? VisualizationSettingsService.applyConversion(
              value.numericValue,
              visualizationSettings.conversion_factor,
              visualizationSettings.decimal_places
            )
          : value.numericValue,
      }));
    }

    return filtered;
  }, [formattedData, selectedYear, params, visualizationSettings]);

  // 統計情報を計算（EstatMapViewと同様の計算方法）
  const validDataPoints = filteredData.filter(
    (value) => value.numericValue !== null && value.numericValue !== 0
  );
  const values = validDataPoints.map((value) => value.numericValue!);

  const summary = {
    totalCount: filteredData.length,
    validCount: validDataPoints.length,
    min: values.length > 0 ? Math.min(...values) : null,
    max: values.length > 0 ? Math.max(...values) : null,
    average:
      values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null,
  };
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
      {/* 年次セレクターとデータサマリー */}
      <div className="p-4">
        <div className="mb-4">
          {/* 年次セレクター */}
          <TimeSelector
            years={formattedData?.years || []}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            className="mb-4"
          />

          {/* カラースキーマセレクターと保存ボタン */}
          <div className="flex items-end gap-4 mb-4">
            <div className="flex-1">
              <ColorSchemeSelector
                options={mapOptions}
                onOptionsChange={setMapOptions}
              />
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={saveSettings}
                disabled={saveLoading || !params?.statsDataId || !params?.categoryCode}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${saveSuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                `}
              >
                {saveLoading ? (
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

          {/* データサマリー */}
          <EstatDataSummary
            totalCount={summary.totalCount}
            validCount={summary.validCount}
            min={summary.min}
            max={summary.max}
            average={summary.average}
          />
        </div>

        {/* コロプレス地図 */}
        <div className="w-full h-full overflow-x-auto mb-6">
          <ChoroplethMap
            data={filteredData}
            width={800}
            height={600}
            className="w-full max-w-full"
            options={mapOptions}
          />
        </div>

        {/* データテーブル */}
        <PrefectureDataTable
          data={filteredData}
          className="mt-6"
          rankingDirection={visualizationSettings?.ranking_direction || "desc"}
        />
      </div>
    </div>
  );
}
