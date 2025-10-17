"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  EstatStatsDataResponse,
  EstatStatsDataFormatter,
} from "@/lib/estat-api";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { StatisticsSummary } from "@/components/ranking/ui/StatisticsSummary";
import { EstatYearSelector } from "@/components/organisms/estat-api/EstatYearSelector";
import { RankingHeader } from "@/components/ranking/ui/RankingHeader";
import { PrefectureDataTableClient } from "@/components/ranking/ui/PrefectureDataTableClient";
import { RankingVisualizationOptions } from "@/types/visualization/ranking-options";
import { Modal } from "@/components/common/Modal/Modal";
import {
  RankingItemSettings,
  RankingItemSettingsData,
} from "@/components/ranking/ui";
import { Settings } from "lucide-react";
import { ExportButton } from "@/components/atoms/ExportButton";
import { RankingItem } from "@/types/models/ranking";

/**
 * EstatRankingDataContainerのプロパティ
 */
interface EstatRankingDataContainerProps {
  rawData: EstatStatsDataResponse; // e-Stat生データ
  rankingKey?: string | null; // ランキングキー（オプショナル）
  rankingItem?: RankingItem[] | null; // ranking_items の設定（オプショナル）
  statsDataId: string; // 統計表ID
  categoryCode: string; // カテゴリコード
  onSettingsChange?: (settings: RankingItemSettingsData) => Promise<void>; // 設定変更コールバック
}

/**
 * e-Stat APIから取得した生データを表示するコンテナ
 * RankingDataContainerと表示コンポーネントを共通利用
 *
 * データフロー:
 * 1. EstatStatsDataResponse (生データ) を受け取る
 * 2. extractAvailableYears() で利用可能な年度を抽出
 * 3. transformEstatToFormattedValues() でFormattedValue[]に変換
 * 4. 年度選択に応じてデータをフィルタリング
 * 5. ChoroplethMap, StatisticsSummary, PrefectureDataTableClientで表示
 */
export const EstatRankingDataContainer: React.FC<
  EstatRankingDataContainerProps
> = ({
  rawData,
  rankingKey,
  rankingItem,
  statsDataId,
  categoryCode,
  onSettingsChange,
}) => {
  // rankingKey と rankingItem が利用可能な場合の処理（将来の拡張用）
  console.log("EstatRankingDataContainer - rankingKey:", rankingKey);
  console.log("EstatRankingDataContainer - rankingItem:", rankingItem);
  // ===== 状態管理 =====
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ===== データ変換 =====
  // Step 1: e-Stat APIレスポンスをフォーマット
  // EstatStatsDataService を使用してデータを変換
  const formattedEstatData = useMemo(() => {
    try {
      return EstatStatsDataFormatter.formatStatsData(rawData);
    } catch (error) {
      console.error("データフォーマットエラー:", error);
      return { years: [], values: [], areas: [], categories: [] };
    }
  }, [rawData]);

  // Step 2: 年度選択の状態管理
  // ユーザーが年度を選択すると、その年度のデータのみを表示
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Step 3: 年度が取得できたら最初の年度を自動選択
  // 最新年度をデフォルト選択として設定
  useEffect(() => {
    if (formattedEstatData.years.length > 0 && !selectedYear) {
      // FormattedYear から年度を抽出
      const firstYear =
        formattedEstatData.years[0].timeName.match(/(\d{4})/)?.[1];
      if (firstYear) {
        setSelectedYear(firstYear);
      }
    }
  }, [formattedEstatData.years, selectedYear]);

  // Step 4: 選択された年度のデータをFormattedValue[]に変換
  // transformEstatToFormattedValues()を使用してe-Stat生データを都道府県別データに変換
  const formattedData = useMemo(() => {
    if (!selectedYear) return [];

    try {
      // 選択された年度のデータのみをフィルタリング
      const filteredValues = formattedEstatData.values.filter((value) => {
        // 年度フィルタ + 全国データ(00000)を除外 + 数値データのみ
        return (
          value.dimensions.time.name &&
          value.dimensions.time.name.includes(selectedYear) &&
          value.dimensions.area.code !== "00000" &&
          value.value !== null
        );
      });

      // FormattedValue[]に変換（RankingValue[]に変換する前の段階）
      const mappedValues = filteredValues.map((value) => ({
        value: value.value || 0, // valueをそのまま使用
        unit: value.unit,
        areaCode: value.dimensions.area.code,
        areaName: value.dimensions.area.name,
        categoryCode: value.dimensions.cat01?.code || "",
        categoryName: value.dimensions.cat01?.name || "",
        timeCode: value.dimensions.time.code,
        timeName: value.dimensions.time.name,
        rank: 0, // ランクは後で計算
      }));

      // 重複を除去（areaCodeでユニークにする）
      const uniqueValues = mappedValues.reduce((acc, current) => {
        const existingIndex = acc.findIndex(
          (item) => item.areaCode === current.areaCode
        );
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // より新しいデータ（数値が大きい）を優先
          if (
            current.value &&
            acc[existingIndex].value &&
            current.value > acc[existingIndex].value
          ) {
            acc[existingIndex] = current;
          }
        }
        return acc;
      }, [] as typeof mappedValues);

      return uniqueValues;
    } catch {
      return [];
    }
  }, [formattedEstatData.values, selectedYear]);

  // ===== サブカテゴリ情報の構築 =====
  // 表示コンポーネント用のサブカテゴリ情報
  const subcategory = {
    id: statsDataId,
    categoryId: "prefecture-ranking",
    name: "都道府県ランキング",
    unit: formattedData[0]?.unit || "",
    colorScheme: "interpolateBlues",
  };

  // ===== 可視化オプション =====
  // 地図表示用の設定（色スキーム、分岐点等）
  const visualizationOptions: RankingVisualizationOptions = {
    colorScheme: "interpolateBlues",
    divergingMidpoint: "zero",
    conversionFactor: 1,
    decimalPlaces: 0,
    rankingDirection: "desc",
  };

  // ===== ローディング状態 =====
  // 年度データが抽出できない場合のローディング表示
  if (formattedEstatData.years.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
        <p className="mt-4 text-gray-600 dark:text-neutral-400">
          データを処理中...
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-neutral-500">
          年度データの抽出に時間がかかっています
        </p>
      </div>
    );
  }

  // ===== メインUIの描画 =====
  return (
    <div>
      {/* ヘッダー部分: タイトル + 年度選択 + 詳細設定ボタン */}
      <RankingHeader
        title={`${subcategory.name}ランキング`}
        yearSelector={
          <EstatYearSelector
            years={formattedEstatData.years}
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
          {/* Step 5a: コロプレス地図表示 */}
          {/* FormattedValue[]をChoroplethMapに渡して地図を描画 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                e-Stat データランキング地図
              </h3>
              <ExportButton
                data={formattedData}
                dataType="estat-ranking"
                metadata={{
                  year: selectedYear,
                  areaName: rankingItem.title,
                }}
              />
            </div>
            <ChoroplethMap
              data={formattedData}
              options={{
                colorScheme:
                  visualizationOptions.colorScheme || "interpolateBlues",
                divergingMidpoint:
                  visualizationOptions.divergingMidpoint || "mean",
              }}
            />
          </div>

          {/* Step 5b: 統計サマリー表示 */}
          {/* FormattedValue[]から統計値（平均、中央値等）を計算して表示 */}
          {formattedData.length > 0 && (
            <div>
              <StatisticsSummary
                data={formattedData.map((item) => ({
                  rankingKey: statsDataId,
                  areaCode: item.areaCode,
                  areaName: item.areaName,
                  timeCode: item.timeCode,
                  timeName: item.timeName,
                  value: item.value ?? 0,
                  unit: item.unit ?? undefined,
                  rank: item.rank,
                }))}
                showStats={{
                  total: false,
                  average: true,
                  max: true,
                  min: true,
                }}
              />
            </div>
          )}
        </div>

        {/* 右側: 都道府県データテーブル */}
        {/* Step 5c: データテーブル表示 */}
        {/* FormattedValue[]をテーブル形式で表示（ランキング順） */}
        <div className="flex-shrink-0">
          <PrefectureDataTableClient data={formattedData} />
        </div>
      </div>

      {/* 詳細設定モーダル（設定変更コールバックがある場合のみ表示） */}
      {/* 設定変更フロー: EstatRankingDataContainer → RankingItemSettings → onSettingsChange → Display.tsx → RankingSettingsPage */}
      {onSettingsChange && (
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          size="lg"
        >
          <RankingItemSettings
            statsDataId={statsDataId}
            cdCat01={categoryCode}
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
