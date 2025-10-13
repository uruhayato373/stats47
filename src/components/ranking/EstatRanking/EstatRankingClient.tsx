"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { PrefectureDataTableClient } from "@/components/choropleth/PrefectureDataTableClient";
import { StatisticsSummary } from "@/components/common/DataTable";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { SubcategoryData } from "@/types/visualization/choropleth";
import { GetStatsDataParams } from "@/lib/estat/types/parameters";
// EstatStatsDataService のインポートを削除（API Route経由でデータ取得）
import {
  RefreshCw,
  AlertCircle,
  Settings,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import VisualizationSettingsPanel from "@/components/estat/prefecture-ranking/SettingsPanel";
import { useVisualizationSettings } from "@/components/estat/prefecture-ranking/Display/hooks/useVisualizationSettings";

export interface EstatRankingProps {
  /**
   * e-stat API パラメータ
   */
  params: Omit<GetStatsDataParams, "appId">;

  /**
   * サブカテゴリーデータ
   */
  subcategory: SubcategoryData;

  /**
   * セクションのタイトル（オプショナル）
   */
  title?: string;

  /**
   * 地図の可視化オプション
   */
  options?: {
    colorScheme?: string;
    divergingMidpoint?: "zero" | "mean" | "median" | number;
  };

  /**
   * 地図の幅（ピクセル）
   */
  mapWidth?: number;

  /**
   * 地図の高さ（ピクセル）
   */
  mapHeight?: number;

  /**
   * CSSクラス名
   */
  className?: string;

  /**
   * データ読み込み完了時のコールバック
   */
  onDataLoaded?: (values: FormattedValue[]) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;

  /**
   * サーバー側で取得した初期データ（オプショナル）
   */
  initialData?: FormattedValue[];

  /**
   * サーバー側で取得した年度一覧（オプショナル）
   */
  initialYears?: string[];

  /**
   * サーバー側で決定した初期年度（オプショナル）
   */
  initialSelectedYear?: string;

  /**
   * 詳細設定パネルを表示するかどうか
   */
  showVisualizationSettings?: boolean;

  /**
   * 設定保存時のコールバック
   */
  onSaveSettings?: (settings: any) => Promise<void>;
}

/**
 * コロプレス地図、統計サマリー、都道府県別データテーブルを一つにまとめたクライアントコンポーネント
 * API Route経由でデータ取得を行い、表示コンポーネントにデータを渡す
 */
export const EstatRankingClient: React.FC<EstatRankingProps> = ({
  params,
  subcategory,
  title,
  options,
  mapWidth = 800,
  mapHeight = 600,
  className = "",
  onDataLoaded,
  onError,
  initialData,
  initialYears,
  initialSelectedYear,
  showVisualizationSettings = false,
  onSaveSettings,
}) => {
  const [formattedValues, setFormattedValues] = useState<FormattedValue[]>(
    initialData || []
  );
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    statsDataId?: string;
    cdCat01?: string;
    message?: string;
    code?: number;
  } | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>(
    initialYears || []
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    initialSelectedYear || ""
  );
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // 詳細設定フック（showVisualizationSettingsがtrueの場合のみ使用）
  const {
    settings,
    editableSettings,
    setEditableSettings,
    saving,
    saveSuccess,
    saveSettings: saveVisualizationSettings,
  } = useVisualizationSettings({
    statsDataId: showVisualizationSettings ? params.statsDataId : undefined,
    categoryCode: showVisualizationSettings ? params.cdCat01 : undefined,
  });

  // 初期データがある場合のコールバック実行
  useEffect(() => {
    if (initialData && initialData.length > 0 && onDataLoaded) {
      onDataLoaded(initialData);
    }
  }, [initialData, onDataLoaded]);

  // ステップ1: 年度一覧を取得（初期データがない場合のみ）
  useEffect(() => {
    if (initialYears && initialYears.length > 0) {
      return; // 初期データがある場合はスキップ
    }

    const fetchAvailableYears = async () => {
      try {
        if (!params.cdCat01) {
          throw new Error("カテゴリコードが指定されていません");
        }

        const searchParams = new URLSearchParams({
          statsDataId: params.statsDataId,
          cdCat01: params.cdCat01 || "",
        });
        const response = await fetch(
          `/api/estat/ranking/years?${searchParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as {
          years?: string[];
          error?: string;
          details?: {
            statsDataId?: string;
            cdCat01?: string;
            message?: string;
            code?: number;
          };
        };

        if (result.error) {
          throw new Error(result.error);
        }

        const years = result.years || [];

        setAvailableYears(years);

        // 最新年度を選択（または指定された年度）
        const targetYear = params.cdTime || years[0] || "";
        setSelectedYear(targetYear);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "年度一覧の取得に失敗しました";
        setError(errorMessage);
        setLoading(false); // ローディングを停止

        // APIレスポンスから詳細情報を取得
        let errorDetails: any = {
          statsDataId: params.statsDataId,
          cdCat01: params.cdCat01,
          message: errorMessage,
        };

        // HTTPエラーの場合はレスポンスから詳細を取得
        if (err instanceof Error && err.message.includes("HTTP error")) {
          try {
            const response = await fetch(
              `/api/estat/ranking/years?${new URLSearchParams({
                statsDataId: params.statsDataId,
                cdCat01: params.cdCat01 || "",
              }).toString()}`
            );
            if (!response.ok) {
              const errorResult = await response.json();
              if (errorResult.details) {
                errorDetails = { ...errorDetails, ...errorResult.details };
              }
            }
          } catch {
            // 詳細取得に失敗した場合はデフォルトの詳細を使用
          }
        }

        setErrorDetails(errorDetails);

        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    };

    fetchAvailableYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.statsDataId, params.cdCat01, params.cdTime, initialYears]);

  // ステップ2: 選択年度のデータを取得（初期データがない場合のみ）
  useEffect(() => {
    if (
      initialData &&
      initialData.length > 0 &&
      selectedYear === initialSelectedYear
    ) {
      return; // 初期データがある場合はスキップ
    }

    const fetchData = async () => {
      if (!selectedYear) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (!params.cdCat01) {
          throw new Error("カテゴリコードが指定されていません");
        }

        const searchParams = new URLSearchParams({
          statsDataId: params.statsDataId,
          cdCat01: params.cdCat01 || "",
          yearCode: selectedYear,
          limit: String(params.limit || 100000),
        });
        const response = await fetch(
          `/api/estat/ranking/data?${searchParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as { data: FormattedValue[] };
        const prefectureValues = result.data || [];

        setFormattedValues(prefectureValues);

        if (onDataLoaded) {
          onDataLoaded(prefectureValues);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "データの取得に失敗しました";
        setError(errorMessage);
        setErrorDetails({
          statsDataId: params.statsDataId,
          cdCat01: params.cdCat01,
          message: errorMessage,
        });

        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedYear,
    params.statsDataId,
    params.cdCat01,
    params.limit,
    initialData,
    initialSelectedYear,
  ]);

  // 年度変更ハンドラー
  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
  }, []);

  // 設定保存ハンドラー
  const handleSaveSettings = useCallback(async () => {
    if (!showVisualizationSettings || !onSaveSettings) return;

    const settingsToSave = {
      ...editableSettings,
      stats_data_id: params.statsDataId,
      cat01: params.cdCat01,
    };

    await saveVisualizationSettings(settingsToSave);
    await onSaveSettings(settingsToSave);
  }, [
    showVisualizationSettings,
    onSaveSettings,
    editableSettings,
    params,
    saveVisualizationSettings,
  ]);

  // ローディング状態
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{ height: "600px" }}
        >
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-neutral-400">
              データを読み込んでいます...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="mx-4 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                データ取得エラー
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p className="mb-2">{error}</p>
                {errorDetails && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-700">
                    <p className="font-medium mb-2">リクエストパラメータ:</p>
                    <ul className="space-y-1 text-xs font-mono">
                      <li>statsDataId: {errorDetails.statsDataId}</li>
                      <li>cdCat01: {errorDetails.cdCat01}</li>
                      {errorDetails.code && (
                        <li>エラーコード: {errorDetails.code}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* タイトルと年度選択UI */}
      <div className="px-4 mb-4 flex items-center justify-between gap-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
        <div className={`flex items-center gap-2 ${title ? "" : "ml-auto"}`}>
          <label
            htmlFor="year-select"
            className="text-sm text-gray-600 dark:text-neutral-400"
          >
            年度:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
            disabled={loading || availableYears.length === 0}
          >
            {availableYears.length === 0 && (
              <option value="">年度を読み込み中...</option>
            )}
            {availableYears.map((yearCode) => {
              const displayYear = yearCode.substring(0, 4);
              return (
                <option key={yearCode} value={yearCode}>
                  {displayYear}年
                </option>
              );
            })}
          </select>

          {/* 詳細設定ボタン */}
          {showVisualizationSettings && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                <Settings className="w-4 h-4" />
                詳細設定
                {showSettingsPanel ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {onSaveSettings && (
                <button
                  onClick={handleSaveSettings}
                  disabled={saving || !params.statsDataId || !params.cdCat01}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors rounded-md
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* 詳細設定パネル */}
      {showVisualizationSettings && showSettingsPanel && (
        <div className="px-4 mb-4">
          <VisualizationSettingsPanel
            editableSettings={editableSettings}
            visualizationSettings={settings}
            params={{
              statsDataId: params.statsDataId,
              categoryCode: params.cdCat01,
            }}
            onSettingsChange={setEditableSettings}
          />
        </div>
      )}

      {/* 地図とデータテーブル */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-4 gap-4">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden gap-4">
          {/* 地図 */}
          <div>
            <ChoroplethMap
              data={formattedValues}
              options={{
                colorScheme:
                  options?.colorScheme ||
                  subcategory.colorScheme ||
                  "interpolateBlues",
                divergingMidpoint: options?.divergingMidpoint || "zero",
              }}
              width={mapWidth}
              height={mapHeight}
            />
          </div>

          {/* 統計サマリー */}
          <div>
            <StatisticsSummary
              data={formattedValues}
              unit={subcategory.unit || ""}
            />
          </div>
        </div>

        {/* データテーブルエリア */}
        <div className="flex-shrink-0">
          <PrefectureDataTableClient
            data={formattedValues}
            subcategory={subcategory}
          />
        </div>
      </div>
    </div>
  );
};
