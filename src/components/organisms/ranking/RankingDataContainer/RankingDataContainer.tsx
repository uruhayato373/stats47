"use client";

import React, { useState, useEffect } from "react";
import {
  useRankingYears,
  useRankingData,
} from "@/hooks/ranking/useRankingData";
import { ChoroplethMap } from "@/components/organisms/visualization/ChoroplethMap";
import { StatisticsSummary } from "../../ranking/ui/StatisticsSummary";
import { YearSelector } from "@/components/molecules/YearSelector";
import { RankingHeader } from "../../ranking/ui/RankingHeader";
import { LoadingView } from "../../ranking/ui/LoadingView";
import { ErrorView } from "../../ranking/ui/ErrorView";
import { PrefectureDataTableClient } from "../../ranking/ui/PrefectureDataTableClient";
import { RankingVisualizationOptions } from "@/types/visualization/ranking-options";
import { Modal } from "@/components/atoms/Modal";
import {
  RankingItemSettings,
  RankingItemSettingsData,
} from "@/components/ranking/ui";
import { ExportButton } from "@/components/atoms/ExportButton";
import { Settings } from "lucide-react";
import { RankingConfigResponse } from "@/lib/ranking/ranking-items";

/**
 * ランキングデータコンテナのプロパティ
 */
interface RankingDataContainerProps {
  rankingConfig: RankingConfigResponse; // ランキング設定（サーバーサイドで取得済み）
  initialYear?: string; // 初期選択年度
  onSettingsChange?: (settings: RankingItemSettingsData) => Promise<void>; // 設定変更コールバック
}

/**
 * ランキングデータ取得と表示のコンテナ
 * useSWRによる効率的なデータフェッチとキャッシング
 */
export const RankingDataContainer: React.FC<RankingDataContainerProps> = ({
  rankingConfig,
  initialYear,
  onSettingsChange,
}) => {
  // ===== 状態管理 =====
  // 詳細設定モーダルの開閉状態
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ===== ranking_itemsデータはpropsから受け取る =====
  // サーバーサイドで取得済みのrankingConfigを使用

  // rankingConfigから必要な情報を抽出
  const activeRankingItem = rankingConfig.rankingItems[0];
  const rankingKey = activeRankingItem?.rankingKey || "default";
  const subcategory = {
    ...rankingConfig.subcategory,
    unit: activeRankingItem?.unit || "",
    name: activeRankingItem?.name || rankingConfig.subcategory?.name || "",
    colorScheme: "interpolateBlues", // デフォルトのカラースキーム
  };

  // ranking_itemsから可視化オプションを構築
  const visualizationOptions: RankingVisualizationOptions | undefined =
    rankingConfig
      ? {
          colorScheme:
            rankingConfig.rankingItems[0]?.mapColorScheme ||
            subcategory.colorScheme ||
            "interpolateGreens",
          divergingMidpoint:
            rankingConfig.rankingItems[0]?.mapDivergingMidpoint || "zero",
          conversionFactor:
            rankingConfig.rankingItems[0]?.conversionFactor || 1,
          decimalPlaces: rankingConfig.rankingItems[0]?.decimalPlaces || 0,
          rankingDirection:
            rankingConfig.rankingItems[0]?.rankingDirection || "desc",
        }
      : undefined;

  // ===== データ取得（useSWR使用） =====
  // 1. 年度一覧を取得（新API: /api/rankings/data/years）
  // データソース: ranking_valuesテーブル（汎用キャッシュ）
  const {
    years,
    isLoading: yearsLoading,
    error: yearsError,
  } = useRankingYears(rankingKey);

  // 2. 選択された年度の状態管理
  const [selectedYear, setSelectedYear] = useState(initialYear || "");

  // 3. 年度が取得できたら最初の年度を自動選択
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  // 4. ランキングデータを取得（新API: /api/rankings/data）
  // データソース: ranking_valuesテーブル（汎用キャッシュ）
  const {
    data,
    isLoading: dataLoading,
    error: dataError,
    refetch,
  } = useRankingData(rankingKey, selectedYear);

  // ===== ローディング・エラー状態の統合 =====
  const loading = yearsLoading || dataLoading;
  const error = yearsError || dataError;

  // ===== ローディング状態の表示 =====
  if (loading) {
    return <LoadingView />;
  }

  // ===== エラー状態の表示 =====
  if (error) {
    return (
      <ErrorView
        error={error}
        details={{
          yearCode: selectedYear,
        }}
        onRetry={refetch} // リトライ機能付き
      />
    );
  }

  // ===== メインUIの描画 =====
  return (
    <div>
      {/* ヘッダー部分: タイトル + 年度選択 + 詳細設定ボタン */}
      <RankingHeader
        title={`${subcategory.name}ランキング`}
        yearSelector={
          <YearSelector
            years={years}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        }
        actions={
          // 詳細設定ボタン（設定変更コールバックがある場合のみ表示）
          onSettingsChange && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
              title="詳細設定"
            >
              <Settings className="w-4 h-4" />
            </button>
          )
        }
      />

      {/* メインコンテンツ: 地図・統計 + データテーブル */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 左側: 地図と統計サマリーの可視化 */}
        <div className="flex-1 flex flex-col overflow-hidden gap-4">
          {/* 地図 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                都道府県ランキング地図
              </h3>
              <ExportButton
                data={data}
                dataType="ranking"
                metadata={{
                  year: selectedYear,
                  areaName: rankingConfig.title,
                }}
              />
            </div>
            <ChoroplethMap
              data={data}
              options={{
                colorScheme:
                  visualizationOptions?.colorScheme || "interpolateBlues",
                divergingMidpoint:
                  visualizationOptions?.divergingMidpoint || "zero",
              }}
            />
          </div>

          {/* 統計サマリー */}
          {data.length > 0 && (
            <div>
              <StatisticsSummary
                data={data.map((item) => ({
                  rankingKey: "", // ランキングキー
                  areaCode: item.areaCode,
                  areaName: item.areaName,
                  timeCode: item.timeCode,
                  timeName: item.timeName,
                  value: item.value ?? 0, // valueをそのまま使用
                  unit: item.unit ?? undefined,
                  rank: item.rank,
                }))}
              />
            </div>
          )}
        </div>

        {/* 右側: 都道府県データテーブル */}
        <div className="flex-shrink-0">
          <PrefectureDataTableClient data={data} />
        </div>
      </div>

      {/* 詳細設定モーダル（設定変更コールバックがある場合のみ表示） */}
      {onSettingsChange && (
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          size="lg"
        >
          <RankingItemSettings
            onSave={async (settings) => {
              // 設定保存後にモーダルを閉じる
              await onSettingsChange(settings);
              setIsSettingsOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
};
