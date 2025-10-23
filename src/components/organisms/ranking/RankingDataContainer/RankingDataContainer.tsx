"use client";

import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/ui/button";
import { RankingHeader } from "@/components/molecules/ranking/RankingHeader";
import { StatisticsSummary } from "@/components/molecules/ranking/StatisticsSummary";
import { YearSelector } from "@/components/molecules/YearSelector";
import { PrefectureDataTableClient } from "@/components/organisms/ranking/PrefectureDataTableClient";
import {
  RankingItemSettings,
  RankingItemSettingsData,
} from "@/components/organisms/ranking/RankingItemSettings";
import { ChoroplethMap } from "@/components/organisms/visualization/ChoroplethMap";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCSVExport } from "@/hooks/export/useCSVExport";
import {
  useRankingData,
  useRankingYears,
} from "@/hooks/ranking/useRankingData";
import { RankingConfigResponse } from "@/lib/ranking/ranking-items";
import { RankingVisualizationOptions } from "@/lib/ranking/types";
import {
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  Settings,
} from "lucide-react";
import React, { useEffect, useState } from "react";

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

  // CSVエクスポート機能
  const { exportToCSV, isExporting } = useCSVExport({
    dataType: "ranking",
    metadata: { year: selectedYear, areaName: rankingConfig.title },
  });

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
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // ===== エラー状態の表示 =====
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>データ取得エラー</AlertTitle>
        <AlertDescription>
          {error.message}
          <div className="mt-3 text-xs">
            <p>詳細情報:</p>
            <ul className="mt-1 space-y-1">
              <li>年度: {selectedYear}</li>
            </ul>
          </div>
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            再試行
          </Button>
        </AlertDescription>
      </Alert>
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
              <Button
                onClick={async () => {
                  await exportToCSV(data);
                }}
                disabled={isExporting || !data || data.length === 0}
                variant="outline"
                size="sm"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                CSVダウンロード
                {data && data.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({data.length}行)
                  </span>
                )}
              </Button>
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
