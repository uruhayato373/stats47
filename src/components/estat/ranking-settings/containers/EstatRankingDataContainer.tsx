"use client";

import React, { useState, useEffect, useMemo } from "react";
import { EstatStatsDataResponse, FormattedYear } from "@/lib/estat/types";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { StatisticsSummary } from "@/components/ranking/ui/StatisticsSummary";
import { YearSelector } from "@/components/common";
import { RankingHeader } from "@/components/ranking/ui/RankingHeader";
import { PrefectureDataTableClient } from "@/components/ranking/ui/PrefectureDataTableClient";
import { RankingVisualizationOptions } from "@/types/visualization/ranking-options";
import { Modal } from "@/components/common/Modal/Modal";
import {
  RankingItemSettings,
  RankingItemSettingsData,
} from "@/components/ranking-settings";
import { Settings } from "lucide-react";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";

/**
 * EstatRankingDataContainerのプロパティ
 */
interface EstatRankingDataContainerProps {
  rawData: EstatStatsDataResponse; // e-Stat生データ
  rankingKey?: string; // ランキングキー（オプショナル）
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
> = ({ rawData, statsDataId, categoryCode, onSettingsChange }) => {
  // ===== 状態管理 =====
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ===== データ変換 =====
  // Step 1: e-Stat APIレスポンスから利用可能な年度を抽出
  // CLASS_OBJ_TIME.CLASSから年度情報を取得し、降順でソート
  const availableYears = useMemo(() => {
    try {
      const formattedData = EstatStatsDataService.formatStatsData(rawData);
      const years = formattedData.years.map(
        (year: FormattedYear) => year.timeName
      );

      // 年度名から4桁の年度を抽出
      const extractedYears: string[] = [];
      years.forEach((yearName: string) => {
        const yearMatch = yearName.match(/(\d{4})/);
        if (yearMatch) {
          extractedYears.push(yearMatch[1]);
        }
      });

      const sortedYears = [...new Set(extractedYears)].sort(
        (a, b) => parseInt(b) - parseInt(a)
      );
      return sortedYears;
    } catch {
      return [];
    }
  }, [rawData]);

  // Step 2: 年度選択の状態管理
  // ユーザーが年度を選択すると、その年度のデータのみを表示
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Step 3: 年度が取得できたら最初の年度を自動選択
  // 最新年度をデフォルト選択として設定
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Step 4: 選択された年度のデータをFormattedValue[]に変換
  // transformEstatToFormattedValues()を使用してe-Stat生データを都道府県別データに変換
  const formattedData = useMemo(() => {
    if (!selectedYear) return [];

    try {
      // EstatStatsDataServiceを使用してデータを変換
      const formattedEstatData = EstatStatsDataService.formatStatsData(rawData);

      // 選択された年度のデータのみをフィルタリング
      const filteredValues = formattedEstatData.values.filter((value) => {
        // 年度フィルタ + 全国データ(00000)を除外 + 数値データのみ
        return (
          value.timeName &&
          value.timeName.includes(selectedYear) &&
          value.areaCode !== "00000" &&
          value.numericValue !== null
        );
      });

      // FormattedValue[]に変換（RankingValue[]に変換する前の段階）
      const mappedValues = filteredValues.map((value) => ({
        value: value.value,
        numericValue: value.numericValue,
        displayValue: value.displayValue,
        unit: value.unit,
        areaCode: value.areaCode,
        areaName: value.areaName,
        categoryCode: value.categoryCode,
        categoryName: value.categoryName,
        timeCode: value.timeCode,
        timeName: value.timeName,
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
            current.numericValue &&
            acc[existingIndex].numericValue &&
            current.numericValue > acc[existingIndex].numericValue
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
  }, [rawData, selectedYear]);

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
  if (availableYears.length === 0) {
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
          <YearSelector
            years={availableYears}
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
                  id: 0, // 仮のID
                  rankingKey: statsDataId,
                  areaCode: item.areaCode,
                  areaName: item.areaName,
                  timeCode: item.timeCode,
                  timeName: item.timeName,
                  value: item.value,
                  numericValue: item.numericValue ?? undefined,
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
          <PrefectureDataTableClient
            data={formattedData}
            subcategory={subcategory}
          />
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
