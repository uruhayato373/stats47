"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  useRankingYears,
  useRankingData,
} from "@/hooks/ranking/useRankingData";
import { RankingVisualization } from "../ui/RankingVisualization";
import { YearSelector } from "../ui/YearSelector";
import { RankingHeader } from "../ui/RankingHeader";
import { LoadingView } from "../ui/LoadingView";
import { ErrorView } from "../ui/ErrorView";
import { PrefectureDataTableClient } from "@/components/choropleth/PrefectureDataTableClient";
import { SubcategoryData } from "@/types/visualization/choropleth";
import { RankingVisualizationOptions } from "@/types/visualization/ranking-options";
import { Modal } from "@/components/common/Modal/Modal";
import {
  RankingItemSettings,
  RankingItemSettingsData,
} from "@/components/ranking-settings";
import { Settings } from "lucide-react";
import { fetcher } from "@/lib/swr/fetcher";
import { RankingConfigResponse } from "@/lib/ranking/ranking-items";

/**
 * ランキングデータコンテナのプロパティ
 */
interface RankingDataContainerProps {
  statsDataId: string; // e-Stat統計表ID（例: "0000010101"）
  cdCat01: string; // カテゴリコード（例: "A1101"）
  subcategory: SubcategoryData; // サブカテゴリ情報
  initialYear?: string; // 初期選択年度
  onSettingsChange?: (settings: RankingItemSettingsData) => Promise<void>; // 設定変更コールバック
}

/**
 * ランキングデータ取得と表示のコンテナ
 * useSWRによる効率的なデータフェッチとキャッシング
 */
export const RankingDataContainer: React.FC<RankingDataContainerProps> = ({
  statsDataId,
  cdCat01,
  subcategory,
  initialYear,
  onSettingsChange,
}) => {
  // ===== 状態管理 =====
  // 詳細設定モーダルの開閉状態
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ===== ranking_itemsデータ取得（useSWR使用） =====
  // サブカテゴリのランキング設定を取得（可視化オプション含む）
  const {
    data: rankingConfig,
    isLoading: rankingConfigLoading,
    error: rankingConfigError,
  } = useSWR<RankingConfigResponse>(
    `/api/ranking-items/subcategory/${subcategory.id}`,
    fetcher
  );

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
  // 1. 年度一覧を取得（API: /api/estat/ranking/years）
  // データソース: estat_ranking_valuesテーブル（キャッシュ） → e-Stat API（フォールバック）
  const {
    years,
    isLoading: yearsLoading,
    error: yearsError,
  } = useRankingYears(statsDataId, cdCat01);

  // 2. 選択された年度の状態管理
  const [selectedYear, setSelectedYear] = useState(initialYear || "");

  // 3. 年度が取得できたら最初の年度を自動選択
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  // 4. ランキングデータを取得（API: /api/estat/ranking/data）
  // データソース: estat_ranking_valuesテーブル（キャッシュ） → e-Stat API（フォールバック）
  const {
    data,
    isLoading: dataLoading,
    error: dataError,
    refetch,
  } = useRankingData(statsDataId, cdCat01, selectedYear);

  // ===== ローディング・エラー状態の統合 =====
  const loading = yearsLoading || dataLoading || rankingConfigLoading;
  const error = yearsError || dataError || rankingConfigError;

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
          statsDataId,
          cdCat01,
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
        <RankingVisualization data={data} options={visualizationOptions} />

        {/* 右側: 都道府県データテーブル */}
        <div className="flex-shrink-0">
          <PrefectureDataTableClient data={data} subcategory={subcategory} />
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
            statsDataId={statsDataId}
            cdCat01={cdCat01}
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
