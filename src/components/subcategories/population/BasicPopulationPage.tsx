"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubcategoryLayout } from "../SubcategoryLayout";
import { EstatChoroplethMap } from "@/components/estat/ChoroplethMap";
import { PrefectureDataTableClient } from "@/components/choropleth/PrefectureDataTableClient";
import { StatisticsSummary } from "@/components/common/DataTable";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface BasicPopulationPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const BasicPopulationPage: React.FC<BasicPopulationPageProps> = ({
  category,
  subcategory,
  currentYear,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [formattedValues, setFormattedValues] = useState<FormattedValue[]>([]);
  const [loading, setLoading] = useState(true);

  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = "A1101"; // 総人口

  // 利用可能な年度を取得
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        setLoading(true);
        console.log('[BasicPopulationPage] Fetching available years...');

        // データを取得（年度フィルタなし、少量のデータのみ）
        const data = await EstatStatsDataService.getAndFormatStatsData(
          statsDataId,
          {
            categoryFilter: cdCat01,
            limit: 100, // 少量のデータで年度情報を取得
          }
        );

        // 年度一覧を抽出
        const years = data.years
          .map(y => y.timeCode)
          .filter(code => code && code.length >= 4)
          .sort((a, b) => b.localeCompare(a)); // 降順ソート（最新が先頭）

        console.log('[BasicPopulationPage] Available years:', years);

        setAvailableYears(years);

        // 最新の年度を選択（または currentYear を使用）
        const latestYear = years[0] || currentYear + '000000';
        setSelectedYear(latestYear);
      } catch (error) {
        console.error('[BasicPopulationPage] Failed to fetch years:', error);
        // エラー時はフォールバック
        const fallbackYears = Array.from(
          { length: 5 },
          (_, i) => String(new Date().getFullYear() - i) + '000000'
        );
        setAvailableYears(fallbackYears);
        setSelectedYear(fallbackYears[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableYears();
  }, [statsDataId, cdCat01, currentYear]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("year", year);
    router.push(
      `/${category.id}/${subcategory.id}?${newSearchParams.toString()}`
    );
  };

  // データ読み込み完了時のコールバック（メモ化して無限ループ防止）
  const handleDataLoaded = useCallback((values: FormattedValue[]) => {
    console.log('[BasicPopulationPage] Data loaded:', values.length);
    setFormattedValues(values);
  }, []);

  // エラーコールバック（メモ化して無限ループ防止）
  const handleError = useCallback((error: Error) => {
    console.error('[BasicPopulationPage] Map error:', error);
  }, []);

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* サブヘッダー */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700">
              <span className="text-gray-600 dark:text-neutral-400">単位:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {subcategory.unit}
              </span>
            </div>

            <div className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700">
              <span className="text-gray-600 dark:text-neutral-400">統計表ID:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {statsDataId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                // タイムコードを年に変換（例: 2020000000 -> 2020）
                const displayYear = yearCode.substring(0, 4);
                return (
                  <option key={yearCode} value={yearCode}>
                    {displayYear}年
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* 統計サマリーカード */}
      <div className="px-4 pt-4">
        <StatisticsSummary data={formattedValues} unit={subcategory.unit} />
      </div>

      {/* メインコンテンツ：2カラムレイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 h-full">
            <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              コロプレス地図
            </h2>
            <div className="h-full">
              {selectedYear ? (
                <EstatChoroplethMap
                  params={{
                    statsDataId: statsDataId,
                    cdCat01: cdCat01,
                    cdTime: selectedYear,
                    limit: 100000,
                  }}
                  options={{
                    colorScheme: subcategory.colorScheme || 'interpolateBlues',
                    divergingMidpoint: 'zero',
                  }}
                  width={800}
                  height={600}
                  onDataLoaded={handleDataLoaded}
                  onError={handleError}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600 dark:text-neutral-400">
                    年度を読み込み中...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* データテーブルエリア */}
        <div className="flex-shrink-0">
          <div className="lg:w-80 h-full lg:border-s border-gray-200 dark:border-neutral-700 lg:ps-4">
            <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 h-full">
              <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                都道府県別データ
              </h2>
              <PrefectureDataTableClient
                data={formattedValues}
                subcategory={subcategory}
              />
            </div>
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
